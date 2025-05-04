import { BASE_URL } from "./CategoryProxy";
import Restapi from "./Restapi";

export const getAllTransaction = (page=1) =>{
    let response = Restapi('get', `${BASE_URL}/api/transactions/?page=${page}`, null);
    if (response.detail) {
        alert(response.detail)
        return null;
    }else{
        return response;
    }   
}

export const createTransaction = (data) =>{
    let response = Restapi('post', `${BASE_URL}/api/transactions/`, data);
    if (response.detail) {
        alert(response.detail)
        return null;
    }else{
        return response;
    }   
}

export const deleteTransaction = (id) =>{
    let response = Restapi('delete', `${BASE_URL}/api/transactions/${id}/`, null);
    if (response.detail) {
        alert(response.detail)
        return null;
    }else{
        return response;
    }
    
}

export const loginProxy = (data) =>{
    let response = Restapi('post', `${BASE_URL}/api/token/`, data);
    // if (response.access) {
    //     return response;
    // }else if(response.detail){
    //     alert(response.detail)
    // }else{
    //     alert('Failed to login')
    // }
    return response;
    
}