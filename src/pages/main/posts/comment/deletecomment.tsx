import React, { useContext, useEffect, useState } from 'react';
import { doc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../../../../config/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faFlag, faTrash} from '@fortawesome/free-solid-svg-icons';

import { useAuthState } from 'react-firebase-hooks/auth';
import { ConfirmationModalContext } from '../post';
import { toast, ToastContainer } from 'react-toastify';




interface DeleteCommentData {
    postId: string;
    commentId: string;
    userId: string;
    refreshComments: (condition: boolean) => void;
    setCommentCount: React.Dispatch<React.SetStateAction<number>>;
  }
  
  export const DeleteComment = ({postId, commentId, userId, refreshComments, setCommentCount}: DeleteCommentData) => {
    const { openModal, isConfirm, setIsConfirm } = useContext(ConfirmationModalContext);
    const [isFirstRender, setIsFirstRender] = useState(true);
    const [open, setOpen] = useState(false); // Toggle the open state for the dropdown
    const [isDeleting, setIsDeleting] = useState(false); // Prevent multiple calls to delete
    const [user] = useAuthState(auth);
    const postRef = doc(db, 'posts', postId);
    const commentRef = doc(postRef, 'comments', commentId);

    // Delete the comment from Firestore
    const deleteThisComment = async () => {
        if (userId === user?.uid && !isDeleting) {
            setIsDeleting(true); // Prevent further calls
            try {
                await deleteDoc(commentRef); // Delete the document
                await updateDoc(postRef, {
                    commentsCount: increment(-1),
                });
                setCommentCount((prev) => prev - 1);
                refreshComments(true);
                console.log('Comment successfully deleted!');
                setOpen(false); // Optionally close the dropdown after successful deletion
            } catch (error) {
                console.error('Error deleting comment:', error);
                toast.error("An error occurred!", {
                            position: "top-center",
                            theme:"colored",
                          });
            } finally {
                setIsDeleting(false); // Reset flag
            }
        }
    };

    // Trigger delete only if confirmation matches this comment
    useEffect(() => {
        if (isConfirm.confirm && isConfirm.id === commentId) {
            setIsConfirm({ confirm: false, id: '' });
            deleteThisComment();
        }
    }, [isConfirm, commentId, setIsConfirm]);

    return(
        <div className='w-auto relative'>
            <button onClick={()=>{setOpen(!open); setIsFirstRender(false);}} className='p-2 relative'><FontAwesomeIcon icon={faEllipsisH} className='text-secondary'/></button>
            <div className={`post-ellipsis ${!isFirstRender ? (open ? 'animate-fadeIn' : 'animate-fadeOut') : 'hidden'}`} >
                <div className="py-2 text-sm ">
                    {userId === user?.uid ? 
                        <button className="block px-4 py-2 text-sm text-secondary  dark:hover:bg-light w-full text-left" onClick={() => {openModal("Are you sure you want to delete this comment? This action cannot be undone.", commentId);}}> <FontAwesomeIcon icon={faTrash} className='text-secondary mr-4'/>Delete</button> 
                        : <button className="block px-4 py-2 text-sm text-secondary  dark:hover:bg-light w-full text-left" onClick={() => {console.log("Post Reported!"); setOpen(false);}}><FontAwesomeIcon icon={faFlag} className='text-secondary mr-4'/>Report</button> }
                   
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};