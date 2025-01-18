import React, { useState } from 'react';
import {auth, db, provider} from "../../config/firebase"
import {signInWithPopup} from 'firebase/auth'
import { useNavigate } from 'react-router-dom'; 
import { SignUpForm } from './signupform';
import { LoginForm } from './loginform';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import axios from 'axios';
import { LoadingScreen } from '../../components/loadingscreen';
import { toast, ToastContainer } from 'react-toastify';
import Artworked from '../../assets/Artworked.png'


export const Login = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, toggleIsSignUp] = useState(false);
    const navigate = useNavigate();

    const signInWithGoogle = async () => {
        try {
          const result = await signInWithPopup(auth, provider);

          setIsLoading(true);

          // Check if the user already exists in Firestore
          const userDocRef = doc(db, "users", result.user.uid);
          const userDocSnap = await getDoc(userDocRef);
    
          // If the user doesn't exist, upload to Cloudinary and create the user in Firestore
          if (!userDocSnap.exists()) {
            console.log("New user detected. Uploading to Cloudinary...");
    
            // Upload to Cloudinary
            const url = await uploadProfilePicToCloudinary(result.user);
            if (!result.user.displayName) {
              console.error("DisplayName is null or undefined.");
              throw new Error("DisplayName is required.");
            }
            // Add the username and other details to Firestore
            await setDoc(userDocRef, {
              username: result.user.displayName,
              lowercaseUsername: result.user.displayName.toLowerCase(),
              email: result.user.email,
              profilePic: url,
            });
          } else {
            console.log("User already exists in Firestore.");
          }
    
          // Navigate to homepage after checking or adding the user
          navigate("/");
    
        } catch (err: unknown) {
           toast.error("An error occurred!", {
                position: "top-center",
                theme:"colored",
            });
          if (err instanceof Error) {
            console.log(err.message);
          }
        } finally {
          setIsLoading(false);
        }
    };



const uploadProfilePicToCloudinary = async (user: any) => {
  if (user && user.photoURL) {
    const userId = user.uid;
      try {

        // Fetch image as a Blob
        const response = await fetch(user.photoURL);
        const blob = await response.blob(); // Convert image URL to Blob

        // Step 1: Request signature from backend
        const signatureResponse = await axios.post("https://artworked-server.onrender.com/generate-signature", { userId, type:"profilePic" });
        const { signature, timestamp, upload_preset, public_id } = signatureResponse.data;

        // Step 2: Create FormData to upload file
        const formData = new FormData();
        formData.append("file", blob);
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
        toast.error("An error occurred!", {
          position: "top-center",
          theme:"colored",
      });
      }
    }
};

    return (
            <section className="login-bg overflow-hidden">
                <div className="flex flex-col items-center justify-center  ">
                    <div className="flex items-center mb-2 text-xl  font-black text-gray-900 dark:text-white">
                        <img className=" sm:w-28 sm:h-28 w-16 h-16 animate-fadeInUp hover:animate-pulse" src={Artworked} alt="Artworked Logo" />
                    </div>
                    <div className="login-card bg-white rounded-lg shadow animate-fadeInUp delay-75">
                        <div className="p-4 space-y-3">
                            <h1 className="font-bold text-xl ">
                               {!isSignUp ? "Sign in to your Account" : "Create an Acccount"}
                            </h1>
                            
                            {isSignUp ?
                                <SignUpForm toggleIsSignUp={toggleIsSignUp}/> : 
                                <LoginForm toggleIsSignUp={toggleIsSignUp} />
                            }

                            <div className="flex items-center gap-3">
                                    <hr className="w-full border-gray-300" />
                                    <p className="text-sm text-gray-800 text-center">or</p>
                                    <hr className="w-full border-gray-300" />
                            </div> 
                            <button type="button" onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-4 py-2 px-5 text-sm tracking-wide  border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 focus:outline-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20px" className="inline" viewBox="0 0 512 512">
                                        <path fill="#fbbd00"
                                        d="M120 256c0-25.367 6.989-49.13 19.131-69.477v-86.308H52.823C18.568 144.703 0 198.922 0 256s18.568 111.297 52.823 155.785h86.308v-86.308C126.989 305.13 120 281.367 120 256z"
                                        data-original="#fbbd00" />
                                        <path fill="#0f9d58"
                                        d="m256 392-60 60 60 60c57.079 0 111.297-18.568 155.785-52.823v-86.216h-86.216C305.044 385.147 281.181 392 256 392z"
                                        data-original="#0f9d58" />
                                        <path fill="#31aa52"
                                        d="m139.131 325.477-86.308 86.308a260.085 260.085 0 0 0 22.158 25.235C123.333 485.371 187.62 512 256 512V392c-49.624 0-93.117-26.72-116.869-66.523z"
                                        data-original="#31aa52" />
                                        <path fill="#3c79e6"
                                        d="M512 256a258.24 258.24 0 0 0-4.192-46.377l-2.251-12.299H256v120h121.452a135.385 135.385 0 0 1-51.884 55.638l86.216 86.216a260.085 260.085 0 0 0 25.235-22.158C485.371 388.667 512 324.38 512 256z"
                                        data-original="#3c79e6" />
                                        <path fill="#cf2d48"
                                        d="m352.167 159.833 10.606 10.606 84.853-84.852-10.606-10.606C388.668 26.629 324.381 0 256 0l-60 60 60 60c36.326 0 70.479 14.146 96.167 39.833z"
                                        data-original="#cf2d48" />
                                        <path fill="#eb4132"
                                        d="M256 120V0C187.62 0 123.333 26.629 74.98 74.98a259.849 259.849 0 0 0-22.158 25.235l86.308 86.308C162.883 146.72 206.376 120 256 120z"
                                        data-original="#eb4132" />
                                    </svg>
                                    Continue with Google
                                    </button>
                        </div>
                    </div>
                </div>
                {isLoading &&  <LoadingScreen />}
                <ToastContainer />
            </section>
    );
};

