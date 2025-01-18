import React, { useContext, useEffect, useState } from 'react';
import { doc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faFlag, faTrash} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import axios from 'axios';
import { ConfirmationModalContext } from './post';
import { toast, ToastContainer } from 'react-toastify';


interface DeletePostData {
    postId: string;
    userId: string;
    userPost: string;

}

export const DeletePost = ({ postId, userId, userPost }: DeletePostData) => {
    const {openModal, isConfirm, setIsConfirm} = useContext(ConfirmationModalContext);
    const [isFirstRender, setIsFirstRender] = useState(true);
    const [open, setOpen] = useState(false); // Toggle the open state for the dropdown
    const [isDeleting, setIsDeleting] = useState(false); // Prevent multiple calls to delete
    
    const navigate = useNavigate();
    const [user] = useAuthState(auth);
    const postRef = doc(db, 'posts', postId);
    const commentsRef = collection(postRef, 'comments');
    const likesRef = collection(postRef, 'comments');

    // Extract the public ID from the image URL
    const prefix = "https://res.cloudinary.com/dqp0ejscz/image/upload/";
    let url = userPost.replace(prefix, ''); // Remove the Cloudinary prefix
    url = url.replace(/^v\d+\//, ''); // Remove the version part 
    url = url.replace(/\.[^/.]+$/, ''); // Remove the file extension

    useEffect(() => {
        // Prevent calling delete if already in progress
        if (isConfirm.confirm && isConfirm.id === postId && !isDeleting) {
            setIsConfirm({ confirm: false, id: '' });
            setIsDeleting(true);  
            deleteThisPost();   
        }
    }, [isConfirm, postId, setIsConfirm]);

    // Delete the post from Firestore
 const deleteThisPost = async () => {
        if (userId === user?.uid ) {
           
            try {

                // Batch deletion for likes
                const likesSnapshot = await getDocs(likesRef);
                const batch = writeBatch(db);

                likesSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
                });

                // Batch deletion for comments
                const commentsSnapshot = await getDocs(commentsRef);
                commentsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
                });

                // Commit batch deletions
                await batch.commit();

                //Delete the Firestore document
                await deleteDoc(postRef); 

                await deleteImageFromCloudinary();
                console.log("url: "+ url);

                // Optionally close the dropdown after successful deletion
                setOpen(false);
               navigate(0);  
               setIsDeleting(false);
            } catch (error) {
                console.warn('Error deleting document:', error);
                toast.error("An error occurred!", {
                    position: "top-center",
                    theme:"colored",
                    });
            } finally {
                setIsDeleting(false); 
            }
        }
    };

    // Trigger delete only if confirmation matches this comment
    // useEffect(() => {
    //     if (isConfirm.confirm && isConfirm.id === postId) {
    //         setIsConfirm({ confirm: false, id: '' });
    //         deleteThisPost();
    //     }
    // }, [isConfirm, postId, setIsConfirm]);



    const deleteImageFromCloudinary = async () => {
        const publicId = url;
        
        if (!publicId) {
            console.warn('Invalid or missing public ID for image deletion.');
            return;
        }
    
        try {
           
            const response = await axios.post(
                'https://artworked-server.onrender.com/delete-image',
                { publicId },
                { headers: { 'Content-Type': 'application/json' } }
            );
            
            console.log('Image deleted:', response.data);
        } catch (error) {
            console.warn('Error response:', error);
            return;
        } 
    };
    

    return (
        <div className='w-auto relative'>
            {user ?
                <button onClick={() => { setOpen(!open); setIsFirstRender(false); }} className='p-2 relative'>
                    <FontAwesomeIcon icon={faEllipsisH} className='text-secondary'/>
                </button>
                :
                <div className='h-5 w-5 m-2 relative'></div>
            }
            <div className={`post-ellipsis ${!isFirstRender ? (open ? 'animate-fadeIn' : 'animate-fadeOut') : 'hidden'}`}>
                <div className="py-2 text-sm ">
                    {userId === user?.uid ? 
                        <button className="block px-4 py-2 text-sm text-secondary  dark:hover:bg-light w-full text-left" onClick={() => openModal("Are you sure you want to delete this post? This action cannot be undone.", postId)}>
                            <FontAwesomeIcon icon={faTrash} className='text-secondary mr-4'/>Delete
                        </button> 
                        : <button className="block px-4 py-2 text-sm text-secondary  dark:hover:bg-light w-full text-left" onClick={() => { console.log("Post Reported!"); setOpen(false); }}>
                            <FontAwesomeIcon icon={faFlag} className='text-secondary mr-4'/>Report
                        </button>
                    }
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};
