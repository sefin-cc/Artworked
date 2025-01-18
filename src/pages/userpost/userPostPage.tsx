import React, { useEffect, useState } from 'react';
import { Post as PostComponent } from '../main/posts/post';
import { Post as IPost } from "../../pages/main/main";
import { LoadingScreen } from '../../components/loadingscreen';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';


export const UserPostPage = () => {
    const { postId } = useParams<{ postId: string }>(); // postId is optional in useParams
    const [isLoading, setIsLoading] = useState(false);
    const [post, setPost] = useState<IPost | null>(null);
     
    const getPost = async () => {
      if (!postId) {
        console.error("No postId provided.");
        return;
      }
  
      try {
        setIsLoading(true);
  
        // Fetch the document by postId
        const postRef = doc(db, "posts", postId); 
        const docSnap = await getDoc(postRef);
    
        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<IPost, 'id'>;
          setPost({
            id: docSnap.id, 
            ...data, 
          });
        } else {
          console.error("No such document!");
          setPost(null); 
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        toast.error("An error occurred!", {
            position: "top-center",
            theme:"colored",
            });
      } finally {
        setIsLoading(false); 
      }
    };
  
    useEffect(() => {
      if (postId) {
        getPost();
      }
    }, [postId]);

    return (
        <div className='flex justify-center text-center w-full h-full p-2'>
            {isLoading && <LoadingScreen />}
            {post ? (
                <PostComponent post={post} />
            ) : (
                !isLoading && <p className='text-secondary py-20'>We can't access this post, it may have been deleted.</p> 
            )}
            <ToastContainer />
        </div>
    );
};
