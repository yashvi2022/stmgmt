from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

app = Flask(__name__)

# CORS (allow frontend App Engine)
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://model-shelter-479506-u6.el.r.appspot.com"
        ]
    }
})

# MongoDB Atlas connection
MONGO_URI = os.environ.get("MONGO_URI")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    print("✅ MongoDB Atlas connected")
except Exception as e:
    print("❌ MongoDB connection error:", e)

db = client["student_portal"]
students_collection = db["students"]

# Helper to serialize ObjectId
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# Health check
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"})


# Get all students
@app.route("/api/students", methods=["GET"])
def get_students():
    students = list(students_collection.find())
    return jsonify([serialize_doc(s) for s in students])


# Get student by ID
@app.route("/api/students/<student_id>", methods=["GET"])
def get_student(student_id):
    student = students_collection.find_one({"_id": ObjectId(student_id)})
    if not student:
        return jsonify({"error": "Student not found"}), 404
    return jsonify(serialize_doc(student))


# Create student
@app.route("/api/students", methods=["POST"])
def create_student():
    data = request.json

    student = {
        "firstName": data.get("firstName"),
        "lastName": data.get("lastName"),
        "email": data.get("email"),
        "studentId": data.get("studentId"),
        "course": data.get("course"),
        "year": data.get("year"),
        "gpa": data.get("gpa", 0.0),
        "status": data.get("status", "active"),
        "createdAt": datetime.utcnow().isoformat()
    }

    result = students_collection.insert_one(student)
    student["_id"] = str(result.inserted_id)

    return jsonify(student), 201


# Update student
@app.route("/api/students/<student_id>", methods=["PUT"])
def update_student(student_id):
    data = request.json

    update_data = {
        "firstName": data.get("firstName"),
        "lastName": data.get("lastName"),
        "email": data.get("email"),
        "studentId": data.get("studentId"),
        "course": data.get("course"),
        "year": data.get("year"),
        "gpa": data.get("gpa"),
        "status": data.get("status"),
        "updatedAt": datetime.utcnow().isoformat()
    }

    result = students_collection.update_one(
        {"_id": ObjectId(student_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Student not found"}), 404

    student = students_collection.find_one({"_id": ObjectId(student_id)})
    return jsonify(serialize_doc(student))


# Delete student
@app.route("/api/students/<student_id>", methods=["DELETE"])
def delete_student(student_id):
    result = students_collection.delete_one({"_id": ObjectId(student_id)})

    if result.deleted_count == 0:
        return jsonify({"error": "Student not found"}), 404

    return jsonify({"message": "Student deleted successfully"})


# Search students
@app.route("/api/students/search", methods=["GET"])
def search_students():
    query = request.args.get("q", "")

    students = list(students_collection.find({
        "$or": [
            {"firstName": {"$regex": query, "$options": "i"}},
            {"lastName": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}},
            {"studentId": {"$regex": query, "$options": "i"}},
        ]
    }))

    return jsonify([serialize_doc(s) for s in students])
