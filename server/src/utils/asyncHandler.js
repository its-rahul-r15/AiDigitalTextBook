const asyncHandler = (requestHandler) => {
    (req, res, next)=>{
        promise.resolve(requestHandler(req,res,next)),
        catch((err) => next(err))
    }

}





export {asyncHandler}