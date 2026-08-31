const Auth = {

    login(username,password){

        if(
            username===APP_CONFIG.login.username &&
            password===APP_CONFIG.login.password
        ){

            sessionStorage.setItem("login","true");

            return true;

        }

        return false;

    },

    logout(){

        sessionStorage.removeItem("login");

        location.href="../index.html";

    },

    check(){

        return sessionStorage.getItem("login")==="true";

    }

}