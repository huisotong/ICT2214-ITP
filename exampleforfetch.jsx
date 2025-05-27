// in frontend

const res = await fetch(`http://localhost:5000/api/posts/like/${postId}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
});

const data = await res.json();

if (!res.ok) {
  throw new Error(data.error || "Failed to toggle like");
}

setLikedPosts((prev) => ({
  ...prev,
  [postId]: data.likes,
}));

// in backend
// @credits_bp.route('/posts/like', methods=['POST'])
// def signup():
//     data = request.get_json()

//     email = data.get('email')
//     username = data.get('username')
//     password = data.get('password')
//     confirm_password = data.get('confirmPassword')

//     new_user = User(
//         email=email,
//         username=username,
//     )

//     try:
//         db.session.add(new_user)
//         db.session.commit()
//         return jsonify({
//         "message": "Sign up was successful! Logging in...",                //wtv returned here goes back to your frontend in await res.json()
//         "access_token": "test",
//         }), 201
//     except Exception as e:
//         db.session.rollback()
//         return jsonify({"error": "Something went wrong. Please try again."}), 500
