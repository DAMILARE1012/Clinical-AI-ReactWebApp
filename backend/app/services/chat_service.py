import logging
from typing import AsyncGenerator
from langchain_groq import ChatGroq
from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from .pinecone_service import get_retriever
from ..config import settings

logger = logging.getLogger(__name__)

REDIS_URL = (
    f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/0"
    if settings.REDIS_PASSWORD
    else f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0"
)

llm = ChatGroq(
    api_key=settings.GROQ_API_KEY,
    model=settings.GROQ_MODEL,
    streaming=True,
)

CONTEXTUALIZE_PROMPT = """Given a chat history and the latest user question which \
may reference previous context, formulate a standalone question that can be \
understood without the chat history. Do NOT answer — only reformulate if needed, \
otherwise return it as-is."""

QA_SYSTEM_PROMPT = """You are an intelligent research assistant for the \
Clinical Research Knowledge Hub. You have access to a shared knowledge base \
containing research projects, experiment logs, and results from the team.

Use the retrieved context below to answer accurately and helpfully.
If the answer is not in the context, say so clearly.
Always cite the project or experiment name when referencing information.

Retrieved context:
{context}"""


def _get_history(session_id: str) -> RedisChatMessageHistory:
    return RedisChatMessageHistory(session_id=session_id, url=REDIS_URL)


async def stream_chat_response(
    message: str, session_id: str
) -> AsyncGenerator[str, None]:
    history = _get_history(session_id)
    past_messages = history.messages

    retriever = get_retriever(k=6)

    # Step 1 — Contextualise query using chat history (non-streaming)
    if past_messages:
        ctx_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", CONTEXTUALIZE_PROMPT),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}"),
            ]
        )
        ctx_chain = ctx_prompt | llm | StrOutputParser()
        standalone_query = await ctx_chain.ainvoke(
            {"input": message, "chat_history": past_messages}
        )
    else:
        standalone_query = message

    # Step 2 — Retrieve relevant documents
    docs = await retriever.ainvoke(standalone_query)
    context_blocks = []
    for doc in docs:
        meta = doc.metadata
        label = (
            f"[{meta.get('content_type', 'content')} | "
            f"Project: {meta.get('project_title', 'Unknown')}]"
        )
        context_blocks.append(f"{label}\n{doc.page_content}")
    context = "\n\n---\n\n".join(context_blocks) if context_blocks else "No relevant context found."

    # Step 3 — Stream the answer
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", QA_SYSTEM_PROMPT),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )
    chain = qa_prompt | llm | StrOutputParser()

    full_response = ""
    async for chunk in chain.astream(
        {"context": context, "input": message, "chat_history": past_messages}
    ):
        full_response += chunk
        yield chunk

    # Persist to Redis after streaming completes
    history.add_user_message(message)
    history.add_ai_message(full_response)
