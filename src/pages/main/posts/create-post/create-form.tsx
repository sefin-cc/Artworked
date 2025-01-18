import React, { useContext, useState } from 'react';
import { useForm } from "react-hook-form";
import * as yup from  'yup';
import { yupResolver } from '@hookform/resolvers/yup'
import {addDoc, collection, getFirestore, serverTimestamp} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../../../App';
import { useGetUserDetails } from '../../../../hooks/useGetUserDetails';
import axios from 'axios';
import { LoadingScreen } from '../../../../components/loadingscreen';
import { toast, ToastContainer } from 'react-toastify';




//this is for typescript,  defines what data types
interface CreateFormData {
    title: string;
    description?: string;
    imagepost: FileList;
}

export const CreateForm = () => {
    const {openPost, setOpenPost, isFirstRenderPost} = useContext(AppContext);
    const { user, username, profilePic } = useGetUserDetails();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    document.body.style.overflow = openPost ? 'hidden' : 'auto';

// Schema for form validation using Yup
const schema = yup.object().shape({
    title: yup.string().max(50, "Title must be less than 50 characters").required("Title is required"),
    description: yup.string().max(500, "Description must be less than 500 characters"),
    imagepost: yup
    .mixed<FileList>() 
    .test('fileType', 'Unsupported file format', (value: FileList | undefined) => {
        return value && ['image/jpeg', 'image/png', 'image/gif'].includes(value[0]?.type);
      })
    .required("Image is required")
  });


    const { register, handleSubmit, formState:{errors}, reset} = useForm <CreateFormData>({
        resolver: yupResolver(schema),
    });

    //this wil be excuted if user clicked the submit
    const onCreatePost = async (data: CreateFormData) =>{

        try{
            setIsLoading(true);
            const db = getFirestore(); 
            const postRef = collection(db, "posts");
            //add an entry to the "posts" database table
            const userId = await user?.uid;
            
            // Upload to Cloudinary
            //const url = await uploadToCloudinary(userId, data);
            const url = await uploadPostToCloudinary(userId, data);
            
            await addDoc(postRef,{
                title: data.title,
                description: data.description,
                imagepost: url,
                username: username,
                userId: user?.uid,
                userPhotoUrl: profilePic,
                likesCount: 0,
                commentsCount:0,
                createdAt: serverTimestamp(),
            });

            
            //go to home
            reset();
            setOpenPost(false);
            navigate(0);
        } catch(e){
            console.log(e)
            toast.error("An error occurred!", {
                position: "top-center",
                theme:"colored",
              });
            
        } finally {
            setIsLoading(false);
        }
        
    };



const uploadPostToCloudinary = async (userId: string | undefined, data: CreateFormData) => {
    if (userId && data.imagepost?.[0] !== undefined) {
        try {
          // Step 1: Request signature from backend
          const signatureResponse = await axios.post("https://artworked-server.onrender.com/generate-signature", { userId , type:"postPic" });
          const { signature, timestamp, upload_preset, public_id } = signatureResponse.data;

          // Step 2: Create FormData to upload file
          const formData = new FormData();
          formData.append("file", data.imagepost[0]);
          formData.append("userId", userId);
          formData.append("signature", signature);
          formData.append("timestamp", timestamp);
          formData.append("upload_preset", upload_preset);
          formData.append("public_id", public_id);
    
          // Step 3: Send the file to backend for upload
          const uploadResponse = await axios.post("https://artworked-server.onrender.com/upload-picture", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
    

          return uploadResponse.data.url;
        } catch (error) {
          console.error("Error uploading banner pic:", error);
          toast.error("An error occurred!", {
            position: "top-center",
            theme:"colored",
          });
        }
      }else{
        return;
      }
};

    return (
        <div aria-hidden={!openPost} className={`create-form ${!isFirstRenderPost ? (openPost ? 'animate-fadeIn' : 'animate-fadeOut') : 'hidden'}`}>
            <div className="relative p-4 w-full max-w-screen-sm max-h-full">            
                <div className="relative bg-white rounded-lg shadow-md">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-200">
                        <h3 className="text-lg font-semibold">
                            Create a Post
                        </h3>
                        <button 
                            type="button" 
                            onClick={() => {setOpenPost(false); reset();}} 
                            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                            </svg>
                            <span className="sr-only">Close modal</span>
                        </button>
                    </div>

                    <form className="p-4 md:p-5 w-full " onSubmit={handleSubmit(onCreatePost)}>
                        <div className="grid gap-4 mb-4 grid-row-3 w-full">
                            <div className="row ">
                                <input 
                                    type="text"  
                                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500" 
                                    placeholder="Title..." 
                                    {...register('title')}  
                                />
                                {errors.title && <p className='text-red-500 text-xs italic'>{errors.title?.message}</p>}
                            </div>
                            <div className="row">
                                <textarea 
                                    rows={7} 
                                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500" 
                                    placeholder="Description..." 
                                    {...register('description')} 
                                />
                                {errors.description && <p className='text-red-500 text-xs italic'>{errors.description?.message}</p>}
                            </div>
                            <div className="row ">
                                
                                <div className='flex items-start'>
                                    <input
                                        className='block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500'
                                        type="file"
                                        accept="image/*"
                                        {...register('imagepost')}
                                    />
                                </div>
                                  
                            {errors.imagepost && <p className="text-red-500 text-xs italic">{errors.imagepost?.message}</p>}
                            </div>
                            
                        </div>
                        <input 
                            className="text-white inline-flex items-center bg-primary hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg px-5 py-2.5 text-center" 
                            type='submit'     
                        />
                    </form>
                </div>
            </div>
            <ToastContainer />
            {isLoading &&  <LoadingScreen />}
        </div>
    );
};