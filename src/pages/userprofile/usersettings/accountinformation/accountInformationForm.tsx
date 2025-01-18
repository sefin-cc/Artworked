
import React, { useState } from 'react'
import { ChangeEmail } from './changeEmail';
import { ChangePassword } from './changePassword';

export const UserAccountForm = () =>{
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);

    return(
        
                        <div className=' flex items-stretch  flex-row w-full bg-white rounded-lg shadow p-5'>
                        
                            <div className="grid gap-4 mb-4 grid-row-3  w-full sm:w-3/6 ">
                                <button
                                    type="button"
                                    onClick={() =>{setIsEmailOpen(true); setIsPasswordOpen(false);}}
                                    className=" text-primary-darker border-2 w-40 border-primary-darker  hover:bg-secondary hover:text-white focus:ring-4 focus:outline-none focus:ring-primary-300 rounded-lg text-sm px-5 py-2 text-center cursor-pointer">
                                    Change Email
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>{setIsEmailOpen(false); setIsPasswordOpen(true);}}
                                    className=" text-primary-darker border-2 w-40 border-primary-darker hover:bg-secondary hover:text-white focus:ring-4 focus:outline-none focus:ring-primary-300 rounded-lg text-sm px-5 py-2 text-center cursor-pointer">
                                    Change Password
                                </button>
                                {isEmailOpen && 
                                    <ChangeEmail setIsEmailOpen={setIsEmailOpen} />
                                }

                                {(isPasswordOpen)&& 
                                    <ChangePassword setIsPasswordOpen={setIsPasswordOpen} />
                                }            
                            </div>
                        </div>
                                   
    );
};