import logging
from pinecone import Pinecone
from langchain_pinecone import PineconeVectorStore
from langchain_community.embeddings import FastEmbedEmbeddings
from ..config import settings

logger = logging.getLogger(__name__)

# Lightweight ONNX-based embeddings — no API key required, runs on CPU
embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")

pc = Pinecone(api_key=settings.PINECONE_API_KEY)


def get_vector_store() -> PineconeVectorStore:
    return PineconeVectorStore(
        index_name=settings.PINECONE_INDEX_NAME,
        embedding=embeddings,
    )


async def upsert_text(text: str, doc_id: str, metadata: dict) -> None:
    """Embed text and upsert a single document into Pinecone."""
    if not text or not text.strip():
        return
    try:
        store = get_vector_store()
        store.add_texts(texts=[text], metadatas=[metadata], ids=[doc_id])
        logger.info("Upserted doc %s to Pinecone", doc_id)
    except Exception as exc:
        logger.error("Failed to upsert doc %s: %s", doc_id, exc)


async def delete_documents(doc_ids: list[str]) -> None:
    """Delete one or more documents from Pinecone by ID."""
    if not doc_ids:
        return
    try:
        index = pc.Index(settings.PINECONE_INDEX_NAME)
        index.delete(ids=doc_ids)
        logger.info("Deleted docs %s from Pinecone", doc_ids)
    except Exception as exc:
        logger.error("Failed to delete docs %s: %s", doc_ids, exc)


def get_retriever(k: int = 5):
    return get_vector_store().as_retriever(search_kwargs={"k": k})
