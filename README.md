# To manage the backend:
sudo systemctl restart fastapi   # restart
sudo systemctl stop fastapi      # stop
sudo systemctl status fastapi    # check status
sudo journalctl -u fastapi -f    # view live logs