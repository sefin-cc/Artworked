
import React, { useEffect, useState } from 'react'
import { useGetUserDetails } from '../../../hooks/useGetUserDetails';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from 'react-hook-form';
import { LoadingScreen } from '../../../components/loadingscreen';
import { collection, doc, getFirestore, updateDoc } from 'firebase/firestore';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

interface ProfileData {
    bannerImage?:FileList;
    profileImage?:FileList;
    username: string;
    bio?: string;
}


export const UserProfileForm = () =>{
    const { user, username, profilePic, bannerPic, bio } = useGetUserDetails();
    const [newbannerLink, setNewBannerLink] = useState<string>(bannerPic || "");
    const [newProfileLink, setNewProfileLink] = useState<string>(profilePic || "");
    const [editOpen, toggleEditOpen] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

        // Yup Schema for Validation
    const profileSchema = yup.object().shape({
        bannerImage: yup
        .mixed<FileList>(),
        profileImage: yup
        .mixed<FileList>(),
        username: yup
          .string()
          .required("Enter a username"),
        bio: yup
          .string()
          .max(500)
    });
      
    const { register, handleSubmit, setValue, formState:{errors}, reset} = useForm <ProfileData>({
        resolver: yupResolver(profileSchema),
    });

    const onUpdateProfileInfo = async (data: ProfileData) =>{
        try{
            setIsLoading(true);
            const userId = await user?.uid;
            const db = getFirestore(); 
            const userCollection = collection(db, "users");
            const userDoc = doc(userCollection, userId);

            const profilePicUrl = await uploadProfilePicToCloudinary(userId, data);
            const bannerPicUrl = await uploadBannerToCloudinary(userId, data);
            
            const updateData: Record<string, any> = {};

            // Add optional fields only if they are defined
            if (profilePicUrl !== undefined) updateData.profilePic = profilePicUrl;
            if (bannerPicUrl !== undefined) updateData.bannerPic = bannerPicUrl;
            if (data.bio !== undefined) updateData.bio = data.bio;
            if (data.username !== undefined) {
                updateData.username = data.username;
                updateData.lowercaseUsername = data.username.toLowerCase();
            }
            
            // Perform the update if there's any data to update
            if (Object.keys(updateData).length > 0) {
                await updateDoc(userDoc, updateData);
                console.log("User profile updated successfully");
            } else {
                console.log("No fields to update");
            }
            //go to home
            reset();
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

    const uploadProfilePicToCloudinary = async (userId: string | undefined, data: ProfileData) => {
        if (userId && data.profileImage?.[0] !== undefined) {
            try {
              // Step 1: Request signature from backend
              const signatureResponse = await axios.post("https://artworked-server.onrender.com/generate-signature", { userId, type:"profilePic" });
              const { signature, timestamp, upload_preset, public_id } = signatureResponse.data;

              // Step 2: Create FormData to upload file
              const formData = new FormData();
              formData.append("file", data.profileImage[0]);
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
              console.error("Error uploading profile pic:", error);
            }
          }else{
            return;
          }
      
};
const uploadBannerToCloudinary = async (userId: string | undefined, data: ProfileData) => {
    if (userId && data.bannerImage?.[0] !== undefined) {
        try {
          // Step 1: Request signature from backend
          const signatureResponse = await axios.post("https://artworked-server.onrender.com/generate-signature", { userId, type:"bannerPic" });
          const { signature, timestamp, upload_preset, public_id } = signatureResponse.data;

          // Step 2: Create FormData to upload file
          const formData = new FormData();
          formData.append("file", data.bannerImage[0]);
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
        }
      }else{
        return;
      }
};


    useEffect(() => {
        if (profilePic) {
            setNewProfileLink(profilePic);
        }
        if (bannerPic) {
             setNewBannerLink(bannerPic);
        } 
      }, [profilePic, bannerPic]);

   

      const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setNewBannerLink(reader.result as string); // Update preview state
            };
            reader.readAsDataURL(file); // Convert file to Base64 string
        }
    };
    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setNewProfileLink(reader.result as string); // Update preview state
            };
            reader.readAsDataURL(file); // Convert file to Base64 string
        }
    };


          useEffect(() => {
            setValue("username", username || "");
            setValue("bio", bio || "");
          }, [username, bio, setValue]);

    return(
        <div>
            {
                !editOpen ?

                (<form onSubmit={handleSubmit(onUpdateProfileInfo)}>
                <div className=' flex items-stretch flex-col sm:flex-row w-full gap-5 '>
                        <div className='w-full h-60 bg-white shadow rounded-lg p-5'>
                            <div className="relative w-full h-3/5 bg-gray-400 rounded-lg overflow-hidden group">
                                <img
                                    src={newbannerLink || "-"} 
                                    className="w-full h-full object-cover"
                                />
                                
                                <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                                
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    {...register('bannerImage', {
                                        onChange: (e) => handleBannerChange(e), // Call custom handler
                                    })}
                                />
                                
                                <FontAwesomeIcon
                                    icon={faEdit}
                                    className="opacity-0 group-hover:opacity-100 text-white absolute top-2 right-2 p-2 rounded-full transition-opacity duration-300 z-20"
                                />
                            </div>

                            <div className="flex items-center justify-center relative -top-14 mb-2.5 z-30 group">
                                <img
                                    src={newProfileLink || "https://res.cloudinary.com/dqp0ejscz/image/upload/v1735899431/blank-profile-picture-973460_1280_idgyn3.png"}
                                    alt="user-avatar-image"
                                    className="border-4 border-solid w-24 h-24 border-light rounded-full object-cover"
                                />
                                <div className="absolute w-24 h-24 rounded-full bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40"></div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute  opacity-0 cursor-pointer w-24 h-24  rounded-full z-50"
                                    {...register('profileImage', {
                                        onChange: (e) => handleProfilePicChange(e), // Call custom handler
                                    })}
                                />
                                <FontAwesomeIcon
                                    icon={faEdit}
                                    className="opacity-0 group-hover:opacity-100 text-white absolute w-5 h-5  p-2 rounded-full transition-opacity duration-300 z-40"
                                />
                            </div>
                           
                        </div>
                        <div className='w-full h-60 bg-white shadow rounded-lg p-5'>
                            <div className="grid gap-4 mb-4 grid-row-3 w-full">
                                <div className="row ">
                                    <label>Username</label>
                                    <input 
                                        type="text"  
                                        className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500" 
                                        placeholder="Username..." 
                                        {...register('username')}
                                    />
                                </div>
                                {errors.username && <p className='text-red-500 text-xs italic'>{errors.username?.message}</p>}
                                <div className="row">
                                    <label>Bio</label>
                                    <textarea 
                                        rows={3} 
                                        style={{ resize: 'none' }} 
                                        className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500" 
                                        placeholder="Bio..." 
                                        {...register('bio')}
                                    />
                                    
                                    {errors.bio && <p className='text-red-500 text-xs italic'>{errors.bio?.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='flex justify-end pt-2 w-full'>
                        <input 
                            className=" text-white border bg-primary w-40 border-gray-300 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 rounded-lg text-sm px-5 py-2 text-center cursor-pointer"
                            type='submit' 
                            value="Update Profile"    
                        />
                    </div>
            </form>) :
            (<div>
                                <div className=' flex items-stretch  flex-col sm:flex-row w-full gap-5 '>
                        <div className='w-full h-60 bg-white shadow rounded-lg p-5'>
                            <div className="relative w-full h-3/5 bg-gray-400 rounded-lg overflow-hidden group">
                                <img
                                    src={newbannerLink || "-"} 
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex items-center justify-center relative -top-14 mb-2.5 z-30 group">
                                <img
                                    src={newProfileLink || "https://res.cloudinary.com/dqp0ejscz/image/upload/v1735899431/blank-profile-picture-973460_1280_idgyn3.png"}
                                    alt="user-avatar-image"
                                    className="border-4 border-solid w-24 h-24 border-light rounded-full object-cover"
                                />
                            </div>
                            
                        </div>
                        <div className='w-full h-60 bg-white shadow rounded-lg p-5'>
                            <div className="grid gap-4 mb-4 grid-row-3 w-full">
                                <div className="row ">
                                    <label>Username</label>
                                    <p className='text-sm'>{username}</p>
                                </div>
                                
                                <div className="row">
                                    <label>Bio</label>
                                    <p className='text-sm'>{bio}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                   
            </div>)
            }
             <div className='flex justify-end py-2 w-full'>
                <button 
                    onClick={() => {toggleEditOpen(!editOpen);}}
                    className="text-primary-darker border-2 w-40 border-primary-darker  hover:bg-secondary hover:text-white focus:ring-4 focus:outline-none focus:ring-primary-300 rounded-lg text-sm px-5 py-2 text-center cursor-pointer"
                    type="button"
                >
                    {editOpen ? "Edit User Profile" : "Cancel"}
                </button>
            </div>
            {isLoading && <LoadingScreen />}
            <ToastContainer />
        </div>

    );
};