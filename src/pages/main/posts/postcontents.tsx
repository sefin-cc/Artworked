import React, { useState } from 'react';
import { Post as IPost } from '../main';
import { addDoc, getDocs, collection, query, where, deleteDoc, doc, increment, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faRegularHeart, faCommentDots } from '@fortawesome/free-regular-svg-icons';
import { DeletePost } from './deletepost';
import { Link, useNavigate } from 'react-router-dom';
import { useGetUserDetails } from '../../../hooks/useGetUserDetails';
import { formatDistanceToNow } from 'date-fns';
import { encryptData } from '../../../helpers/encryptionUtils';



interface Props {
    post: IPost;
    isOpenComments?: React.Dispatch<React.SetStateAction<boolean>> | null; 
    setFirstRender?: React.Dispatch<React.SetStateAction<boolean>> | null; 
    likesCount: number;
    setLikesCount: React.Dispatch<React.SetStateAction<number>>;
    hasUserLiked: boolean;
    setHasUserLiked: React.Dispatch<React.SetStateAction<boolean>>;
    commentCount: number;
}

interface Like {
    likeId: string;
    userId: string;
}

export const PostContents = ({post, isOpenComments, setFirstRender, likesCount, setLikesCount, hasUserLiked, setHasUserLiked, commentCount} : Props) =>{
    const [likes, setLikes] = useState<Like[] | null>(null);
    const { user, username, profilePic } = useGetUserDetails();
    const navigate = useNavigate();
    const postRef = doc(db, 'posts', post.id);
    //set a reference/ specify  the database table
    const likesRef = collection(postRef, "likes");



    

    //this wil be excuted if user clicked the submit
    const addLike = async () =>{
        if(user){ 
            try{
                //add an entry to the "likes" database table
                //specify the data to be passed
                const newDoc = await addDoc(likesRef,{
                    userId: user?.uid, 
                    postId: post.id,
                    });
                await updateDoc(postRef, {
                    likesCount: increment(1),
                });
                setHasUserLiked(true);
                setLikesCount((prev) => prev + 1);
            } catch( error ) {
                console.log(error);
            } finally {
                addLikeNotification(post.userId, post.id, user?.uid);
            }
        }else{
            navigate("/login");
        }
    };
    const removeLike = async () =>{
        if(user){
            try{
                const likeToDeleteQuery = query(likesRef, where("postId", "==", post.id), where("userId", "==", user?.uid));
                const likeToDeleteData =await getDocs(likeToDeleteQuery);
                const likeId = likeToDeleteData.docs[0].id;
                const likeToDelete = doc(postRef, "likes", likeId)
                await deleteDoc(likeToDelete);
                    
                await updateDoc(postRef, {
                    likesCount: increment(-1),
                });

                setLikes((prev) => prev && prev.filter((like) => like.likeId !== likeId));
                setHasUserLiked(false);
                setLikesCount((prev) => prev - 1);
                
                } catch( error ) {
                    console.log(error);
                }
        }else{
            navigate("/login");
        }     
    };
    
    const addLikeNotification = async (receiverId: string, postId: string, triggeredBy: string) => {
        try{
            const notificationId = `${postId}_${triggeredBy}_like`; // Unique ID based on event
            const notificationRef = doc(db, "notifications", receiverId, "notifications", notificationId);
          
            await setDoc(notificationRef, {
              type: "like",
              postId: postId,
              triggeredBy: triggeredBy,
              triggeredByUsername: username|| "Artworked User",
              triggeredByProfilePicture: profilePic || null,
              read: false,
              createdAt: serverTimestamp(),
            });
        } catch (e) {
            console.log(e);
        }
      };

    return (
                    <div>
                            <div className='title'>
                                <div className='w-full'>
                                        <div className='flex text-center items-center'>
                                            <div className='flex text-center items-center w-full'>
                                                <img src ={post?.userPhotoUrl || "https://res.cloudinary.com/dqp0ejscz/image/upload/v1735899431/blank-profile-picture-973460_1280_idgyn3.png"} className='h-6 w-6 rounded-full object-cover mr-2'/>
                                                <div className='text-left'>
                                                    <Link to={`/userprofile/${encodeURIComponent(encryptData(post.userId))}`}>
                                                        <p style={{ fontSize: "12px" }}>{post.username}</p>
                                                    </Link>
                                                    <p className="text-secondary" style={{ fontSize: "8px" }}>{post.createdAt
                                                        ? `${formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })}`
                                                        : "Just now"}</p>
                                                </div>
                                                
                                               
                                            </div>
                                            
                                           <DeletePost  postId={post.id} userId={post.userId} userPost={post.imagepost}/>
                                        </div>
                                        
                                    <p className='text-base'>{post.title}</p>
                                    <p className='text-xs font-normal '>{post.description}</p>
                                </div>
                               
                            </div> 
                            <div className='body flex justify-center text-center'>
                                <img src ={post?.imagepost || ""} className='max-h-96 rounded-lg'/>
                        
                          
                            </div> 
                            <div  className='flex text-center items-center px-3 py-1 '>
                                <div className='flex text-center items-center mr-3'>
                                    <button  className="mr-1" onClick={hasUserLiked ? removeLike : addLike}>{hasUserLiked ? <FontAwesomeIcon icon={faHeart} className='text-primary'/>: <FontAwesomeIcon icon={faRegularHeart} className='text-primary'/>}</button>
                                    <p className='text-sm'>{likesCount}</p>
                                </div>
                                <div className='flex text-center items-center mr-3'>
                                    <button  className="mr-1" onClick={()=> {isOpenComments?.(true); setFirstRender?.(false); }}>{<FontAwesomeIcon icon={faCommentDots} className='text-primary'/>}</button>
                                    <p className='text-sm'>{commentCount}</p>
                                </div>
                            </div> 
                     
                    </div>
    );
};