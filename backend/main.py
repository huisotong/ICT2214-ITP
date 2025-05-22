import os
from app import create_app
from dotenv import load_dotenv

# need rmb set flask env in docker
debug = True
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

app = create_app()

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=debug)
