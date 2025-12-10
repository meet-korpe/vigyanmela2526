"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";

interface Review {
  _id: string;
  reviewerName: string;
  reviewerEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewsListProps {
  projectId: string;
  projectName: string;
  initialReviews: Review[];
  loginReturnUrl: string;
}

export default function ReviewsList({
  projectId,
  projectName,
  initialReviews,
  loginReturnUrl,
}: ReviewsListProps) {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Find user's existing review
  const userReview = session?.user?.email
    ? reviews.find((r) => r.reviewerEmail === session.user?.email)
    : null;

  const handleEditClick = (review: Review) => {
    setEditingReview(review);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setIsEditMode(false);
  };

  const handleSuccess = async () => {
    // Refresh reviews from server
    try {
      const response = await fetch(`/api/reviews?projectId=${projectId}&limit=100`);
      const data = await response.json();
      setReviews(data.reviews);
    } catch (error) {
      console.error("Error refreshing reviews:", error);
    }
    setEditingReview(null);
    setIsEditMode(false);
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete your review?")) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setReviews(reviews.filter((r) => r._id !== reviewId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("An error occurred while deleting the review");
    }
  };

  return (
    <>
      {/* Reviews Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Reviews</h2>

        <div className="space-y-4">
          {reviews.length === 0 && (
            <div className="text-gray-700 dark:text-gray-300">
              No reviews yet. Be the first to review this project!
            </div>
          )}

          {reviews.map((review) => {
            const isOwnReview = session?.user?.email === review.reviewerEmail;

            return (
              <div
                key={review._id}
                className={`rounded-lg border p-4 shadow-sm ${
                  isOwnReview
                    ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {review.reviewerName}
                        {isOwnReview && (
                          <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
                            (You)
                          </span>
                        )}
                      </p>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {review.createdAt !== review.updatedAt && " (edited)"}
                    </p>
                  </div>

                  {/* Edit/Delete buttons for own review */}
                  {isOwnReview && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(review)}
                        className="rounded-md px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="rounded-md px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <p className="mt-2 text-gray-700 dark:text-gray-200">{review.comment}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Review Form Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {userReview && !isEditMode
            ? "Your Review"
            : isEditMode
            ? "Edit Your Review"
            : "Leave a Review"}
        </h2>

        {isEditMode ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
            <ReviewForm
              projectId={projectId}
              projectName={projectName}
              existingReview={editingReview}
              onSuccess={handleSuccess}
              onCancel={handleCancelEdit}
              loginReturnUrl={loginReturnUrl}
            />
          </div>
        ) : userReview ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-700 dark:bg-blue-900/20">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              You have already reviewed this project. You can edit or delete your review above.
            </p>
          </div>
        ) : (
          <ReviewForm
            projectId={projectId}
            projectName={projectName}
            onSuccess={handleSuccess}
            loginReturnUrl={loginReturnUrl}
          />
        )}
      </section>
    </>
  );
}
