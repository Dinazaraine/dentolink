import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

export default function CheckoutForm({ onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/orders", // page de retour après succès
      },
    });

    if (error) {
      setErrorMessage(error.message || "Erreur lors du paiement");
    } else {
      onClose();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage && <div style={{ color: "red", marginTop: 8 }}>{errorMessage}</div>}
      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          marginTop: 12,
          padding: "10px 16px",
          borderRadius: 8,
          background: "#007",
          color: "#fff",
          border: "none",
        }}
      >
        {loading ? "Traitement..." : "Payer"}
      </button>
    </form>
  );
}
