import React from 'react'
import { UserProfileForm } from './userprofileform';
import { UserAccountForm } from './accountinformation/accountInformationForm';

export const UserSettings = () =>{

    return(
        <div className='overflow-hidden ' style={{ height: 'calc(100vh - 64px)' }} >
          
                <div className='flex items-stretch  flex-col marker:w-full  gap-5 px-4 md:px-20 sm:px-30 py-10  overflow-y-auto h-full scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full  '>
                    <p className='text-xl'>User Profile</p>  
                    <UserProfileForm />

                    <p className='text-xl'>Account Information</p>
                    <UserAccountForm />
                </div>
            
        </div>
    );
}