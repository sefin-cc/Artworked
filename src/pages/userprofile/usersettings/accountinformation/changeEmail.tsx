import React, { useEffect, useState } from 'react'
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from 'react-hook-form';
import { useGetUserDetails } from '../../../../hooks/useGetUserDetails';
import { collection, doc, getFirestore, query, updateDoc, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '../../../../components/loadingscreen';
import { toast, ToastContainer } from 'react-toastify';

interface EmailData {
    email: string;
}

interface Props {
    setIsEmailOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChangeEmail = ({setIsEmailOpen}: Props) =>{
    const { user, email } = useGetUserDetails();
    const [newEmail, setNewEmail] = useState<string>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const accountSchema = yup.object().shape({
        email: yup.string().email('Invalid email').required("Email is required"),
    });
      
    const { register, handleSubmit, setValue, formState:{errors}, reset} = useForm <EmailData>({
        resolver: yupResolver(accountSchema),
    });

    const onUpdateEmail = async (data: EmailData) =>{
        try{

            setIsLoading(true);
            const db = getFirestore(); 
            const emailCollection = collection(db, "users");
            const emailDoc = doc(emailCollection, user?.uid);
            
            await updateDoc(emailDoc,{
               email: data.email
            });
            console.log("Updated Email: "+ data.email);

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

    useEffect(() => {
        if (newEmail) {
            setNewEmail(newEmail);
        }

        setValue("email", email || "");
    }, [newEmail, email]);


    return(
        <form onSubmit={handleSubmit(onUpdateEmail)}>
            <div className="row ">
            <label>Email</label>
                    <input 
                        type="email"  
                        className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500" 
                        placeholder="user@email.com" 
                        {...register('email')}
                    />
                    {errors.email && <p className='text-red-500 text-xs italic'>{errors.email?.message}</p>}
            </div>
            <div className='flex justify-end py-4 w-full gap-2'>
                <button 
                        onClick={() => setIsEmailOpen(false)}
                        className="text-primary-darker border-2  w-full sm:w-40  border-primary-darker  hover:bg-secondary hover:text-white focus:ring-4 focus:outline-none focus:ring-primary-300 rounded-lg text-sm px-5 py-2 text-center cursor-pointer"
                        type="button"
                        >
                        Cancel
                        </button>
                <input 
                    className=" text-white border bg-primary  w-full sm:w-40  border-gray-300 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 rounded-lg text-sm px-5 py-2 text-center cursor-pointer"
                    type='submit' 
                    value="Update Email"    
                />
            </div>
            {isLoading && <LoadingScreen />}
            <ToastContainer />
        </form>
    );
};