import { BASE_URL } from "./CategoryProxy";
import Restapi from "./Restapi"

export const getAllBudget = () =>{
    let response = Restapi('get', `${BASE_URL}/api/budgets/`, null);
    if (response.detail) {
        alert(response.detail)
        return null;
    }else{
        return response;
    }   
}

export const createBudget = (data) =>{
    let response = Restapi('post', `${BASE_URL}/api/budgets/`, data);
    if (response.detail) {
        alert(response.detail)
        return null;
    }else{
        return response;
    }   
}

export const updateBudget = (id, data) =>{
    let response = Restapi('put', `${BASE_URL}/api/budgets/${id}/`, data);
    if (response.detail) {
        alert(response.detail)
        return null;
    }else{
        return response;
    }   
}