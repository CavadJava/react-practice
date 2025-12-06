import axios from "axios";

async function getUsers(){
    try {
        return await axios.get("https://dummyjson.com/users")
            .then((response)=>{
                console.log("AxiosUtils:", response.data)
                return response.data;
            })
            .catch((error)=>{
                console.log(error)
            })
    }catch (error){
        console.log(error)
    }
}
export default getUsers;
