import { useState } from "react";
import { relativeTime } from "../utils.js";
import CommentForm from "./CommentForm.jsx";

const MAX_DEPTH = 3;

function insertReply(tree, parentId, reply) {
  return tree.map((comment) => {
    if (comment.id === parentId) {
      return { ...comment, replies: [...comment.replies, { ...reply, replies: [] }] };
    }
    if (comment.replies.length) {
      return { ...comment, replies: insertReply(comment.replies, parentId, reply) };
    }
    return comment;
  });
}

export default function CommentThread({ postId, comments, onCommentsChange }) {
  function handleReplyAdded(parentId, reply) {
    onCommentsChange((prev) => insertReply(prev, parentId, reply));
  }

  return (
    <ul className="comment-list">
      {comments.map((comment) => (
        <CommentNode key={comment.id} postId={postId} comment={comment} onReplyAdded={handleReplyAdded} />
      ))}
    </ul>
  );
}

function CommentNode({ postId, comment, onReplyAdded }) {
  const [replying, setReplying] = useState(false);
  const canReply = comment.depth < MAX_DEPTH;

  return (
    <li className={`comment depth-${comment.depth}`}>
      <div className="comment-meta">
        <span className="comment-author">{comment.author}</span>
        <span className="comment-time">{relativeTime(comment.createdAt)}</span>
      </div>
      <p className="comment-body">{comment.content}</p>
      <div className="comment-actions">
        {canReply && (
          <button className="link-button" onClick={() => setReplying((v) => !v)}>
            {replying ? "Cancel" : "Reply"}
          </button>
        )}
      </div>

      {replying && (
        <CommentForm
          postId={postId}
          parentId={comment.id}
          placeholder={`Replying to ${comment.author}`}
          onAdded={(reply) => {
            onReplyAdded(comment.id, reply);
            setReplying(false);
          }}
          onCancel={() => setReplying(false)}
        />
      )}

      {comment.replies.length > 0 && (
        <ul className="comment-list comment-list-nested">
          {comment.replies.map((reply) => (
            <CommentNode key={reply.id} postId={postId} comment={reply} onReplyAdded={onReplyAdded} />
          ))}
        </ul>
      )}
    </li>
  );
}
