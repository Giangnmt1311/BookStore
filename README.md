# BookStore
E-Commerce project built with React, Node.js/Express, MongoDB and Python to deliver a personalized shopping experience through data-driven recommendations.

## Setup

### Frontend 
* Go to the frontend directory by using ```cd frontend```.
* Create a **.env.local** file in the backend root directory as the same level where the **package.json** is located and keep the following environment variables there:
```
VITE_API_KEY=""
VITE_Auth_Domain=""
VITE_PROJECT_ID=""
VITE_STORAGE_BUCKET=""
VITE_MESSAGING_SENDERID=""
VITE_APPID=""
```
+ Run ``npm install`` to install node dependencies.
* Finally, to run the project, use ``npm run dev``.


### Backend
* Go to the backend directory by using ```cd backend```.
* Run ``npm install`` to install node dependencies.
* Create a **.env** file in the backend root directory as the same level where the **package.json** is located and keep the following environment variables there: 
```
DB_URL = ''
JWT_SECRET_KEY = ''
GEMINI_API_KEY= ''
GEMINI_MODEL= ''
CLOUDINARY_CLOUD_NAME=''
CLOUDINARY_API_KEY=''
CLOUDINARY_API_SECRET=''

Note: Setup mongodb and change the MongoDB url, and set your jwt, gemini, cloudinary secret key.
```

- Finally, to run the project, use ``npm run start:dev``.

### Recommendation
+ Run ``pip install -r requirements.txt`` to install python libraries
+ Then run ``python recommendation.py`` to start recommendation.
