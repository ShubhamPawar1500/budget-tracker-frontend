import Restapi from "./Restapi"

export const BASE_URL = 'https://budget-tracker-backend-lh7z.onrender.com'

export const getAllCategories = () =>{
    let response = Restapi('get', `${BASE_URL}/api/categories/`, null);
    if (response.detail) {
        alert(response.detail)
        return null;
    }else{
        return response;
    }
    
}

export const createCategories = (data) =>{
    let response = Restapi('post', `${BASE_URL}/api/categories/`, data);
    if (response.detail) {
        alert(response.detail)
        return null;
    }else{
        return response;
    }
    
}

export const deleteCategories = (id) =>{
    let response = Restapi('delete', `${BASE_URL}/api/categories/${id}/`, null);
    if (response.detail) {
        alert(response.detail)
        return null;
    }else{
        return response;
    }
    
}