import { useState } from "react";
import { relativeTime } from "../utils";
import CommentForm from "./CommentForm";
import type { Comment, CommentTree } from "../types";
const insertReply = (
  tree: CommentTree[],
  parentId: string,
  reply: Comment,
): CommentTree[] =>
  tree.map((comment) =>
    comment.id === parentId
      ? { ...comment, replies: [...comment.replies, { ...reply, replies: [] }] }
      : comment.replies.length
        ? { ...comment, replies: insertReply(comment.replies, parentId, reply) }
        : comment,
  );
export default function CommentThread({
  postId,
  comments,
  onCommentsChange,
}: {
  postId: string;
  comments: CommentTree[];
  onCommentsChange: (
    updater: (previous: CommentTree[]) => CommentTree[],
  ) => void;
}) {
  return (
    <ul className="comment-list">
      {comments.map((comment) => (
        <CommentNode
          key={comment.id}
          postId={postId}
          comment={comment}
          onReplyAdded={(parentId, reply) =>
            onCommentsChange((previous) =>
              insertReply(previous, parentId, reply),
            )
          }
        />
      ))}
    </ul>
  );
}
function CommentNode({
  postId,
  comment,
  onReplyAdded,
}: {
  postId: string;
  comment: CommentTree;
  onReplyAdded: (parentId: string, reply: Comment) => void;
}) {
  const [replying, setReplying] = useState(false);
  return (
    <li className={`comment depth-${comment.depth}`}>
      <div className="comment-meta">
        <span className="comment-author">{comment.author}</span>
        <span className="comment-time">{relativeTime(comment.createdAt)}</span>
      </div>
      <p className="comment-body">{comment.content}</p>
      {comment.depth < 3 && (
        <button className="link-button" onClick={() => setReplying((v) => !v)}>
          {replying ? "Cancel" : "Reply"}
        </button>
      )}
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
            <CommentNode
              key={reply.id}
              postId={postId}
              comment={reply}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
