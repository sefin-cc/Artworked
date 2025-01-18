import React, { createContext, useEffect, useState } from "react";
import { Post as IPost } from "../main";
import { PostContents } from "./postcontents";
import { PostPopUp } from "./postpopup";
import { collection, doc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../../config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useGetComment } from "../../../../src/hooks/useGetComments";
import { ConfirmationModal } from "../../../components/confirmationmodal";


interface Props {
  post: IPost;
}
interface Like {
  likeId: string;
  userId: string;
}

interface ConfirmationModalInterface {
  isModalOpen: boolean;
  isConfirm: { confirm: boolean; id: string }; 
  setIsConfirm: React.Dispatch<React.SetStateAction<{ confirm: boolean; id: string }>>;
  openModal: (msg: string, id: string) => void;
  closeModal: () => void;
}

// Create the context with default values
export const ConfirmationModalContext = createContext<ConfirmationModalInterface>({
  isModalOpen: false, 
  isConfirm: {confirm: false, id: ''},
  setIsConfirm: () => {},
  openModal: () => {}, 
  closeModal: () => {}, 
});

export const Post = ({ post }: Props) => {
  const [openComments, isOpenComments] = useState(false);
  const [firstRender, setFirstRender] = useState(true);
  const [likes, setLikes] = useState<Like[] | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [hasUserLiked, setHasUserLiked] = useState(false);
  const [user] = useAuthState(auth);
  const { comments } = useGetComment(post);
  const [commentCount, setCommentCount] =  useState(0);

  const [isModalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmationId ,setconfirmationtId] = useState('');
  const [isConfirm, setIsConfirm] = useState({
    confirm: false,
    id: "",
  });
  
  const onConfirmHandler = () => {
    setIsConfirm({confirm: true, id: confirmationId});
    setModalOpen(false);
  };
    
  const openModal = (msg: string, id: string) => {
    if(msg === ''){
      setMessage("Are you sure you want to continue? This action cannot be undone.");
    } else{
      setconfirmationtId(id);
      setMessage(msg);
    }
    setModalOpen(true);
  };
    
  const closeModal = () => {
    setIsConfirm({confirm: false, id: confirmationId});
    setModalOpen(false);
    setMessage("");
  };



  // Fetch initial likes
  const getInitialLikesCount = async () => {
    const postRef = doc(db, 'posts', post.id);
    const likesRef = collection(postRef, "likes");
    const likesQuery = query(likesRef, where("postId", "==", post.id));
    try {
      const data = await getDocs(likesQuery);
      const likesArray = data.docs.map((doc) => ({
        userId: doc.data().userId,
        likeId: doc.id,
      }));
      setLikes(likesArray); // Set likes state
    } catch (error) {
      console.error("Error fetching likes:", error);
      setLikes([]); // Default to empty array on error
    }
  };

  // Update `likesCount` when `likes` changes
  useEffect(() => {
    if (likes) {
      setLikesCount(likes.length);
    }
  }, [likes]);

  // Determine if the user has liked the post
  useEffect(() => {
    if (likes && user?.uid) {
      const userHasLiked = likes.some((like) => like.userId === user.uid);
      setHasUserLiked(userHasLiked);
    } else {
      setHasUserLiked(false);
    }
  }, [likes, user?.uid]);

  useEffect(() => {
    if (comments) {
      setCommentCount(comments.length); // Update comment count when comments change
    }
  }, [comments]);

  // Fetch likes on mount
  useEffect(() => {
    getInitialLikesCount();
  }, []);

  // Manage body scroll when comments are opened
  useEffect(() => {
    document.body.style.overflow = openComments && !firstRender ? "hidden" : "auto";
  }, [openComments, firstRender]);

  return (
    <div className="flex-row justify-items-center w-full">
      <ConfirmationModalContext.Provider value={{ isModalOpen, isConfirm, setIsConfirm ,openModal: (msg: string, id: string) => openModal(msg, id), closeModal }}>
          <PostPopUp
            post={post}
            isOpenComments={isOpenComments}
            openComments={openComments}
            firstRender={firstRender}
            likesCount={likesCount}
            setLikesCount={setLikesCount}
            hasUserLiked={hasUserLiked}
            setHasUserLiked={setHasUserLiked}
            commentCount={commentCount}
            setCommentCount={setCommentCount}
          />
          <div className="post-card animate-fadeIn">
            <PostContents
              post={post}
              isOpenComments={isOpenComments}
              setFirstRender={setFirstRender}
              likesCount={likesCount}
              setLikesCount={setLikesCount}
              hasUserLiked={hasUserLiked}
              setHasUserLiked={setHasUserLiked}
              commentCount={commentCount}
            />
          </div>
          < ConfirmationModal
              isOpen={isModalOpen}
              onClose={closeModal}
              onConfirm={onConfirmHandler}
              message={message}
              />
      </ConfirmationModalContext.Provider>
    </div>
  );
};
