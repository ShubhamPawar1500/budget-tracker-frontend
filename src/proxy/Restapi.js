import axios from "axios";

const Restapi = async (method,url,data) => {
    var config = {
        method: method,
        maxBodyLength:  Infinity,
        url:url,
        headers: {
            'Content-Type': 'application/json',
        },
        data:data
    };
    
    if (localStorage.getItem('authToken')) {
      config.headers['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;
    }

    try {

        const response = await axios(config);

        return response.data;


    } catch (error) {
        if (error.response) {
            if (error.response.status === 500) {
              console.log('Server error occurred:', error.response.data);
              return error.response.data
            } else {
              console.log('Error response from server:', error.response.data);
              return error.response.data;
            }
          } else {
            console.log('Error making request:', error.message);
            return error.message;
          }
    }
}


export default Restapi;