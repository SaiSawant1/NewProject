const User=require("../models/User")
const Note=require("../models/Note")
const asyncHandler=require('express-async-handler')
const bcrypt=require('bcrypt')
//GET all users

const getAllUsers=asyncHandler(async(req,res,next)=>{
    const users= await User.find().select('-password').lean()
    if(!users?.length){
        return res.status(400).json({message:'NO user found!'})
    }
    return res.json(users)
})
const createNewUser=asyncHandler(async(req,res,next)=>{
    const{username,password,roles}=req.body
    if(!username||!password||!Array.isArray(roles)||!roles.length){
        return res.status(400).json({message:'All fields are required'})
    }
    const duplicate=await User.findOne({username}).lean().exec()
    
    if(duplicate){
        return res.status(409).json({message:"Duplicate Username"})
    }

    const hashedPwd=await bcrypt.hash(password,10)
    const userObject={username,"password":hashedPwd,roles,}
    const user= await User.create(userObject)
    if(user){
       return res.status(201).json({message:`New user ${username} create`})
    }else{
        return res.status(400).json({message:`Invalid user data received`})
    }
})
const updateUser=asyncHandler(async(req,res,next)=>{
    const {id,username,roles,active,password}=req.body
    if(!id||!username||!Array.isArray(roles)||!roles.length||typeof active!=='boolean'){
        return res.status(400).json({message:"all fields are required"})
    }
    const user=await User.findById(id).exec()
    if(!user){
        return res.status(400).json({message:'user not found'})
    }
    const duplicate = await User.findOne({username}).lean().exec()
    if(duplicate && duplicate?._id.toString()!==id){
        return res.status(409).json({message:'Duplicate Username'})
    }
    
    user.username=username
    user.roles=roles
    user.active=active

    if(password){
        const hashedPwd=await bcrypt.hash(password,10)
        user.password=hashedPwd
    }
    const updatedUser=await user.save();
    res.json({message:`${updatedUser.username} updated`})

})
const deleteUser=asyncHandler(async(req,res,next)=>{
    const {id}=req.body
    if(!id){
        return res.status(400).json({message:"id required to delete"})
    }
    const note=await Note.findOne({user:id}).lean().exec()
    if(note){
        return res.status(400).json({message:'User has assigned notes'})
    }
    const  user=await User.findById(id).exec()

    if(!user){
        return res.status(400).json({message:'User not found'})
    }
    const result=await user.deleteOne()
    const reply=`Username ${result.username} with ID ${result._id} deleted`
    res.json(reply)
})
module.exports={
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}