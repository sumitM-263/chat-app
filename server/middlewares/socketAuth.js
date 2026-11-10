import jwt from 'jsonwebtoken';
import User from "./models/User.js";

export default socketAuth = async (socket, next) =>{
    try {
        
        const token = socket.handshake.auth?.token;

        if(!token){
            return next(new Error("Authentication error: Token missing"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("_id");

        if(!user){
            return next(new Error("Authentication error: User not found"));
        }

        socket.data.userId = user._id.toString();

        next();

    } catch (error) {
        next(new Error("Authentication error: Invalid token"));
    }
}