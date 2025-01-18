import React, { useState } from 'react';
import {getAuth} from 'firebase/auth'
import { useNavigate } from 'react-router-dom'; 
import {createUserWithEmailAndPassword} from "firebase/auth"
import * as yup from  'yup';
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form';
import { collection, doc, getDoc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';
import { LoadingScreen } from '../../components/loadingscreen';
import { ToastContainer } from 'react-toastify';

interface SignUpFormData{
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface SignUpFormProps {
  toggleIsSignUp?: React.Dispatch<React.SetStateAction<boolean>> | null; 
}

export const SignUpForm = ({toggleIsSignUp}: SignUpFormProps) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    //Sign up schema
    const signUpSchema = yup.object({
        username: yup.string().required('Username is required'),
        email: yup.string().email('Invalid email').required('Email is required'),
        password: yup.string()
            .min(6, 'Password must be at least 6 characters') 
            .matches(/[A-Z]/, 'Password must contain at least one uppercase letter') 
            .matches(/[0-9]/, 'Password must contain at least one number') 
            .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character') 
            .required('Password is required'), 
        confirmPassword: yup
            .string()
            .oneOf([yup.ref('password')], 'Passwords must match')
            .required('Confirm Password is required'),
    }).required();

    const { register, handleSubmit, setError, formState:{errors}, reset} = useForm <SignUpFormData>({
        resolver: yupResolver(signUpSchema),
    });

    const onSignup = async (data: SignUpFormData) => {
      try {
      setIsLoading(true);
      const db = getFirestore();
      const auth = getAuth();
      // Check if the username is already taken in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", data.username));  // Query to check if the username already exists
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // If querySnapshot is not empty, username is already taken
        console.log('This username is already in use.');
        setError("username", { type: "manual", message: "This username is already in use. Please try a different one." });
        return; // Prevent signup if the username is already taken
      }

        // Check if the username is already taken
        const usernameRef = doc(db, "users", data.username);
        const usernameDoc = await getDoc(usernameRef);
        
        // Proceed with creating the user
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;
    
        // Add the username and other details to Firestore
        await setDoc(doc(db, "users", user.uid), {
          username: data.username,
          lowercaseUsername: data.username.toLowerCase(),
          email: data.email,
        });
    
        reset(); 
        navigate("/");
    
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.message.includes('auth/email-already-in-use')) {
            console.log('This email is already in use.');
            setError("email", { type: "manual", message: "This email is already in use. Please try with a different email." });
          } else {
            console.log(err.message); 
            alert('An error occurred. Please try again later.');
          }
        } else {
          console.log('An unknown error occurred.');
          alert('An unknown error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };


    return(
        <form className="space-y-4 md:space-3 animate-fadeIn" onSubmit={handleSubmit(onSignup)}>
            <div>
                <label  className="block mb-1 text-sm  ">Username</label>
                <input type="text" className="bg-light border border-gray-300 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2" placeholder="username123" {...register('username')}   />
                {errors.username && <p className='text-red-500 text-xs italic'>{errors.username.message}</p>}
            </div>
            <div>
                <label  className="block mb-1 text-sm  ">Email</label>
                <input type="email" className="bg-light border border-gray-300 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2" placeholder="name@company.com" {...register('email')}   />
                {errors.email && <p className='text-red-500 text-xs italic'>{errors.email.message}</p>}
            </div>
            <div>
                <label className="block mb-1 text-sm  ">Password</label>
                <input type="password" placeholder="••••••••" className="bg-light  text-sm  border border-gray-300  rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2 " {...register('password')}   />
                {errors.password && <p className='text-red-500 text-xs italic'>{errors.password.message}</p>}
            </div>
            <div>
                <label className="block mb-1 text-sm  ">Confirm Password</label>
                <input type="password" placeholder="••••••••" className="bg-light  text-sm  border border-gray-300  rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2 " {...register('confirmPassword')}   />
                {errors.confirmPassword && <p className='text-red-500 text-xs italic'>{errors.confirmPassword.message}</p>}
            </div>

            <input type="submit" className="w-full text-white bg-primary hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 rounded-lg text-sm px-5 py-2 text-center  "/>
            <div className='flex items-center gap-1 '>
                <p className="text-sm  text-secondary"> Have an account?  </p>
                <p onClick={() => toggleIsSignUp?.(false)} className="text-primary hover:underline text-sm ">Login here</p>
            </div>
            {isLoading && <LoadingScreen />}
            <ToastContainer />
        </form>
        );
};