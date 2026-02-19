Class ApiError extends Error{
    constructor(
        statusCode,
        messsage="someting went wrong",
        errors = [],
        statck=""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message= message
        this.sucess = false;
        this.errors = errors

        if(statck){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

 
export {ApiError} 