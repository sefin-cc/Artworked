import React from 'react';
import { Post as IPost } from '../main'; 
import { PostContents } from './postcontents';
import { addDoc, collection, doc, increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DeleteComment } from './comment/deletecomment';
import { useGetComment } from "../../../../src/hooks/useGetComments";
import { useGetUserDetails } from '../../../hooks/useGetUserDetails';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import { toast, ToastContainer } from 'react-toastify';


interface Props {
    post: IPost;
    openComments: boolean;
    isOpenComments?: React.Dispatch<React.SetStateAction<boolean>> | null;
    firstRender: boolean;
    likesCount: number;
    setLikesCount: React.Dispatch<React.SetStateAction<number>>;
    hasUserLiked: boolean;
    setHasUserLiked: React.Dispatch<React.SetStateAction<boolean>>;
    commentCount: number;
    setCommentCount: React.Dispatch<React.SetStateAction<number>>;
}

interface CreateCommentData {
    comment: string;
}

export const PostPopUp = ({ post, openComments, isOpenComments, firstRender , likesCount, setLikesCount, hasUserLiked, setHasUserLiked, commentCount, setCommentCount} : Props) => { 
    const { user, username, profilePic } = useGetUserDetails();
    const { comments, getComment } = useGetComment(post);
    const postRef = doc(db, 'posts', post.id);
    const navigate = useNavigate();
    // Firestore reference and query for comments
    const commentRef = collection(postRef, 'comments');

    // Schema for validating comment data using yup
    const schema = yup.object().shape({
        comment: yup.string().required('Comment is required'),
    });

    const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateCommentData>({
        resolver: yupResolver(schema),
    });

    // Add a new comment to Firestore
    const addComments = async (data: CreateCommentData) => {
        if(user){
            try {
                await addDoc(commentRef, {
                    ...data,
                    postId: post.id,
                    userId: user?.uid,
                    userName: username,
                    userPhotoUrl: profilePic,
                    createdAt: serverTimestamp()
                });
                await updateDoc(postRef, {
                    commentsCount: increment(1),
                });
                reset(); 
                setCommentCount((prev) => prev + 1);
                refreshComments(true);  // Refresh comments after adding a new one
            } catch (error) {
                console.error('Error adding comment:', error);
                toast.error("An error occurred!", {
                    position: "top-center",
                    theme:"colored",
                    });
            } finally {
                addCommentsNotification(post.userId, post.id, user?.uid);
            }
        }else{
            navigate("/login");
        }
    };

    const refreshComments = (condition : boolean) =>{
        if (condition){
            getComment();
            condition = false;
        } return;
    }

    const addCommentsNotification = async (receiverId: string, postId: string, triggeredBy: string) => {
        try{
            const notificationId = `${postId}_${triggeredBy}_comment_${uuidv4().slice(0, 8)}`; // Unique ID based on event
            const notificationRef = doc(db, "notifications", receiverId, "notifications", notificationId);
        
            await setDoc(notificationRef, {
            type: "comment",
            postId: postId,
            triggeredBy: triggeredBy,
            triggeredByUsername: username|| "Artworked User",
            triggeredByProfilePicture: profilePic || null,
            read: false,
            createdAt: serverTimestamp(),
            });
        }catch (e){
            console.log(e);
        }
      };


    return (
        <div className={`post-popup ${!firstRender ? (openComments ? 'animate-fadeIn' : 'animate-fadeOut') : 'hidden'}`}>
            <div className='card p-1 '>
                <div className="flex items-center justify-between p-1 border-b rounded-t dark:border-gray-200 w-full">
                    <h3 className="text-base font-black text-center flex-grow">
                        {post.username}'s Post
                    </h3>
                    <button 
                        type="button" 
                        onClick={() => isOpenComments?.(false)} 
                        className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white">
                        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                        </svg>
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>

                <div className='h-5/6 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full  '>
                    <div className='mx-1 border-b'>
                        <PostContents post={post} likesCount={likesCount} setLikesCount={setLikesCount} hasUserLiked={hasUserLiked} setHasUserLiked={setHasUserLiked} commentCount={commentCount} /> 
                    </div>

                    {/* Comments Section */}
                    <div>
                        {comments.map((comment) => (
                            <div key={comment.commentId} className="group flex items-center gap-3 py-2 hover:bg-light px-5 transition-all duration-300">
                                <div className='w-10'>
                                    <img src={comment.userPhotoUrl ||"https://res.cloudinary.com/dqp0ejscz/image/upload/v1735899431/blank-profile-picture-973460_1280_idgyn3.png"} className='h-9 w-9 rounded-full object-cover'/>
                                </div>
                                <div className='w-11/12 flex flex-col space-y-0'>
                                    <p style={{ fontSize: "10px" }}>{comment.userName}</p>
                                    <p className='text-sm' >{comment.comment}</p>
                                    <p className="text-secondary" style={{ fontSize: "8px" }}>{comment.createdAt
                                                ? `${formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}`
                                                : "Just now"}</p>
                                </div>
                                {user && 
                                    <div className=' opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                                        <DeleteComment postId={post.id} commentId={comment.commentId} userId={comment.userId} refreshComments={refreshComments} setCommentCount={setCommentCount} />
                                    </div>
                                }
                              
                            </div>
                        ))}
                    </div>
                </div>

                {/* Input for new comment */}
                <form onSubmit={handleSubmit(addComments)}>
                    <div className="flex items-center gap-1 border-t py-2">
                        <div className='w-14'>
                            <img src={profilePic || "https://res.cloudinary.com/dqp0ejscz/image/upload/v1735899431/blank-profile-picture-973460_1280_idgyn3.png"}  className='h-12 w-12 rounded-full object-cover'/>
                        </div>
                        <textarea 
                            rows={1}
                            style={{ resize: 'none' }} 
                            className="h-fit p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500" 
                            placeholder="Write a comment..." 
                            {...register('comment')} 
                        />
                        {errors.comment ?
                            <button
                                className="text-white inline-flex items-center bg-primary p-3  rounded-lg text-center opacity-60"
                                type="submit"
                                disabled>
                            <FontAwesomeIcon icon={faPaperPlane} />
                            </button> 
                            :
                            <button
                                className="text-white inline-flex items-center bg-primary hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg p-3 text-center"
                                type="submit">
                            <FontAwesomeIcon icon={faPaperPlane} />
                            </button>
                        }
                    </div>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
};
