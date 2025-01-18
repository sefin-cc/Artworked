import React, { useState } from 'react';
import {getAuth, signInWithEmailAndPassword} from 'firebase/auth'
import { useNavigate } from 'react-router-dom'; 
import * as yup from  'yup';
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form';
import { LoadingScreen } from '../../components/loadingscreen';
import { toast, ToastContainer } from 'react-toastify';


interface LoginFormData{
    email: string;
    password: string;
    rememberMe?: boolean;
}

interface LoginFormProps {
  toggleIsSignUp?: React.Dispatch<React.SetStateAction<boolean>> | null; 
}

export const LoginForm = ({toggleIsSignUp}: LoginFormProps) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    //login schema
    const loginSchema = yup.object({
        email: yup.string().email('Invalid email').required('Email is required'),
        password: yup.string()
            .min(6, 'Password must be at least 6 characters') 
            .matches(/[A-Z]/, 'Password must contain at least one uppercase letter') 
            .matches(/[0-9]/, 'Password must contain at least one number') 
            .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character') 
            .required('Password is required'), 
        rememberMe: yup.boolean(),
    }).required();

    const { register, handleSubmit, setError, formState:{errors}, reset} = useForm <LoginFormData>({
        resolver: yupResolver(loginSchema),
    });

    const onLogin = async (data: LoginFormData) => {
        try {
          setIsLoading(true);
          const auth = getAuth();
          signInWithEmailAndPassword(auth, data.email, data.password);
      
          
          reset(); // Reset form after successful signup
          navigate("/");
        }catch (err: unknown) {
            toast.error("An error occurred!", {
                    position: "top-center",
                    theme:"colored",
                });
          if (err instanceof Error) {

    
            // Handle specific Firebase authentication errors
            if (err.message.includes('auth/invalid-credential')) {
              // Set custom error message for email field when user is not found
              setError("password", { type: "manual", message: "Invalid email or password" });
            } else {
              console.log(err.message); // Log other errors
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
            <form onSubmit={handleSubmit(onLogin)} className="space-y-1 md:space-y-2 animate-fadeIn">
            <div>
                <label  className="block mb-2 text-sm  ">Email</label>
                <input type="email" className="bg-light border border-gray-300 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2" placeholder="name@company.com" {...register('email')} />
                {errors.email && <p className='text-red-500 text-xs italic'>{errors.email.message}</p>}
            </div>
            <div>
                <label className="block mb-2 text-sm  ">Password</label>
                <input type="password" placeholder="••••••••" className="bg-light  text-sm  border border-gray-300  rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2 " {...register('password')} />
                {errors.password && <p className='text-red-500 text-xs italic'>{errors.password.message}</p>}
            </div>
            <div className="flex justify-end">
                <a href="#" className="text-sm text-secondary hover:underline ">Forgot password?</a>
            </div>
            <button type="submit" className="w-full text-white bg-primary hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 rounded-lg text-sm px-5 py-2 text-center  ">SIGN IN</button>
            <div className='flex items-center gap-1 '>
                <p className="text-sm  text-secondary"> Don’t have an account yet? </p>
                <p onClick={() => toggleIsSignUp?.(true)} className="text-primary hover:underline  text-sm ">Sign up here</p>
            </div>
            {isLoading && <LoadingScreen />}
            <ToastContainer />
        </form>
        );
};