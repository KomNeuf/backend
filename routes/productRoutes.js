const express = require("express");
const { Router } = express;
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  searchProduct,
  deleteProduct,
  getLikedProducts,
  toggleSaveProduct,
  getSimilarProducts,
  incrementViewCount,
  getFilteredProducts,
  getProductsByUserId,
  getAllVerifiedProducts,
  updateProductVerificationStatus,
} = require("../controllers/productController");

const productRoutes = Router();
productRoutes.post("/create", createProduct);
productRoutes.get("/filter", getFilteredProducts);
productRoutes.get("/search", searchProduct);
productRoutes.get("/get-all-products", getAllProducts);
productRoutes.get("/get-all-verified-products", getAllVerifiedProducts);
productRoutes.get("/liked/:userId", getLikedProducts);
productRoutes.get("/:productId", getProductById);
productRoutes.get("/user-products/:userId", getProductsByUserId);
productRoutes.get("/similar-products/:productId", getSimilarProducts);
productRoutes.put("/update-product/:productId", updateProduct);
productRoutes.put("/save-product/:productId/:userId", toggleSaveProduct);
productRoutes.put("/view/:productId/:userId", incrementViewCount);
productRoutes.delete("/delete/:productId", deleteProduct);

productRoutes.put(
  "/verified-product/:productId",
  updateProductVerificationStatus
);

module.exports = productRoutes;
