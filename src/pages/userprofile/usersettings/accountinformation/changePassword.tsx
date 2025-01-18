
import React, { useState } from 'react'
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from 'react-hook-form';
import { LoadingScreen } from '../../../../components/loadingscreen';
import { EmailAuthProvider, getAuth, linkWithCredential, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';



interface PasswordData {
    currentPassword?: string;
    password: string;
    confirmPassword: string;
}
interface Props {
    setIsPasswordOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChangePassword = ({ setIsPasswordOpen} :  Props) =>{
    const [isLoading, setIsLoading] = useState(false);
    const auth = getAuth();
    const navigate = useNavigate();

    const accountSchema = yup.object().shape({
        currentPassword: yup.string(),
        password: yup.string()
            .min(6, 'Password must be at least 6 characters') 
            .matches(/[A-Z]/, 'Password must contain at least one uppercase letter') 
            .matches(/[0-9]/, 'Password must contain at least one number') 
            .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character') 
            .required('Password is required'), 
        confirmPassword: yup
            .string()
            .oneOf([yup.ref('password')], 'Passwords must match')
            .required('Confirm Password is required')
    });


        const { register, handleSubmit, formState:{errors}, setError, reset} = useForm <PasswordData>({
            resolver: yupResolver(accountSchema),
        });
    
        const onUpdatePassword = async (data: PasswordData) =>{
            if (!auth.currentUser) {
                console.error("No user is signed in.");
                return;
              }
            
              const user = auth.currentUser;
              const providerIds = user.providerData.map(provider => provider.providerId);
            
              try {
                setIsLoading(true);
                if (providerIds.includes("google.com") && !providerIds.includes("password")) {
                  // User signed in with Google and does not have a password linked
                  console.log("Linking email/password credential for Google account.");
            
                  const email = user.email;
                  if (!email) {
                    throw new Error("Google account does not have an email associated.");
                  }
            
                  // Create a credential
                  const credential = EmailAuthProvider.credential(email, data.password);
            
                  // Link the credential to the current user
                  const linkedUser = await linkWithCredential(user, credential);
                  console.log("Password successfully created for Google account:", linkedUser);
                  reset();
                  navigate(0);
                } else if (providerIds.includes("password")) {
                  // User already has a password linked: Reauthenticate and update the password
                  console.log("User already has a password linked. Reauthenticating and updating password.");
            
                  if (data.currentPassword) {
                    try {
                      // Reauthenticate the user
                      const credential = EmailAuthProvider.credential(user.email!, data.currentPassword);
                      await reauthenticateWithCredential(user, credential);
                    } catch (error: any) {
                      if (error.code === "auth/invalid-credential") {
                        setError("currentPassword", { type: "manual", message: "The current password is incorrect." });
                        throw new Error("The current password is incorrect.");
                      }
                      throw error; // Re-throw any other errors
                    }
                  } else {
                    setError("currentPassword", { type: "manual", message: "Current password is required for reauthentication." });
                    throw new Error("Current password is required for reauthentication.");
                }
            
                  // Update the password
                  await updatePassword(user, data.password);
                  console.log("Password successfully updated.");
                  reset();
                  navigate(0);
                } else {
                  console.error("Unhandled provider type. Cannot set or update password.");
                }
              } catch (error: any) {
                  toast.error("An error occurred!", {
                      position: "top-center",
                      theme:"colored",
                      });
                if (error.code === "auth/requires-recent-login") {
                  console.error("Reauthentication required:", error.message);
                  alert("Please reauthenticate to update your password.");
                } else {
                  console.error("Error setting password:", error.message);
                  alert(error.message);
                }
              }finally{
                setIsLoading(false);
              }
            
         };
    return(
        <form onSubmit={handleSubmit(onUpdatePassword)}>
                                    <div>
                                        <div className="row ">
                                            <label>Current Password</label>
                                            <input 
                                                type="password"  
                                                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500" 
                                                placeholder="••••••••"
                                                {...register('currentPassword')}
                                            />
                                            {errors.currentPassword && <p className='text-red-500 text-xs italic'>{errors.currentPassword?.message}</p>}
                                        </div>     
                                        <div className="row ">
                                            <label>Pasword</label>
                                            <input 
                                                type="password"  
                                                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500" 
                                                placeholder="••••••••"
                                                {...register('password')}
                                            />
                                            {errors.password && <p className='text-red-500 text-xs italic'>{errors.password?.message}</p>}
                                        </div>     
                                    <div className="row ">
                                        <label>Confirm Password</label>
                                        <input 
                                            type="password"  
                                            className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500" 
                                            placeholder="••••••••" 
                                            {...register('confirmPassword')}
                                        />
                                        {errors.confirmPassword && <p className='text-red-500 text-xs italic'>{errors.confirmPassword?.message}</p>}
                                    </div>  
                                    <div className='flex justify-end py-4 w-full gap-2'>
                                        <button 
                                            onClick={() => setIsPasswordOpen(false)}
                                            className="text-primary-darker border-2 w-full sm:w-40  border-primary-darker  hover:bg-secondary hover:text-white focus:ring-4 focus:outline-none focus:ring-primary-300 rounded-lg text-sm px-5 py-2 text-center cursor-pointer"
                                            type="button"
                                        >
                                        Cancel
                                        </button>
                                        <input 
                                            className=" text-white border bg-primary w-full sm:w-40 border-gray-300 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 rounded-lg text-sm px-5 py-2 text-center cursor-pointer"
                                            type='submit' 
                                            value="Update Password"    
                                        />
                                    </div>       
                                </div>
                                {isLoading && <LoadingScreen />}
                                <ToastContainer />
        </form>
    );
};