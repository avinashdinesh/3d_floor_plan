from flask import Flask, request, jsonify
import pickle
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow requests from your frontend

# Load the trained model and label binarizer
with open("furniture_ml_model.pkl", "rb") as model_file:
    model, mlb = pickle.load(model_file)

@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        data = request.json
        budget = float(data["budget"])

        # Hardcoded conditions
        if budget < 10000:
            return jsonify({"recommendations": ["bed"]})
        elif 13000 <= budget < 20000:
            return jsonify({"recommendations": ["bed", "dining1"]})

        # Model prediction for budgets 20000 and above
        budget_input = np.array([[budget]])  # Ensure input is 2D
        predicted_labels = model.predict(budget_input)
        recommended_items = mlb.inverse_transform(predicted_labels)[0]  # Convert back to item names

        return jsonify({"recommendations": recommended_items})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5001, debug=True)  # Debug mode to catch errors