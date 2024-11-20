const Notification = require("../models/notificationModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");

const cloudinary = require("cloudinary").v2;

const createProduct = async (req, res) => {
  try {
    if (!req.files || !req.files.photos) {
      return res.status(400).json({
        success: false,
        message: "No files were uploaded.",
      });
    }
    const files = Array.isArray(req.files.photos)
      ? req.files.photos
      : [req.files.photos];

    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          file.tempFilePath,
          { resource_type: "auto" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
      });
    });

    const fileUrls = await Promise.all(uploadPromises);
    const generateReferenceNumber = () => {
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 10000);
      return `REF-${timestamp}-${randomNum}`;
    };
    const referenceNumber = generateReferenceNumber();
    const newProduct = new Product({
      ...req.body,
      photos: fileUrls,
      referenceNumber: referenceNumber,
    });

    await newProduct.save();

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    console.error("Error creating product", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("userId")
      .sort({ createdAt: -1 })
      .exec();

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error retrieving form products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve form products",
      error: error.message,
    });
  }
};

const getAllVerifiedProducts = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const verifiedProducts = await Product.find({ visibleStatus: "Approved" })
      .populate("userId")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .exec();

    return res.status(200).json({
      success: true,
      data: verifiedProducts,
    });
  } catch (error) {
    console.error("Error retrieving verified products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve verified products",
      error: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const deletePromises = product.photos.map((photoUrl) => {
      const publicId = photoUrl.split("/").pop().split(".")[0];
      return cloudinary.uploader.destroy(publicId);
    });

    await Promise.all(deletePromises);
    await Product.findByIdAndDelete(productId);

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error });
  }
};

const updateProduct = async (req, res) => {
  const { productId } = req.params;
  const updatedData = req.body;

  try {
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let photoUrls = [...existingProduct.photos];
    if (req.files && req.files.photos) {
      const files = Array.isArray(req.files.photos)
        ? req.files.photos
        : [req.files.photos];

      const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            file.tempFilePath,
            { resource_type: "auto" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          );
        });
      });

      const newPhotoUrls = await Promise.all(uploadPromises);
      photoUrls = [...photoUrls, ...newPhotoUrls];
    }

    updatedData.photos = photoUrls;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updatedData,
      { new: true, runValidators: true }
    )
      .populate("userId")
      .exec();

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId).populate("userId").exec();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error retrieving product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product",
      error: error.message,
    });
  }
};

const updateProductVerificationStatus = async (req, res) => {
  const { productId } = req.params;
  const { visibleStatus, adminComment } = req.body;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    if (
      visibleStatus &&
      ["Pending", "Approved", "Rejected"].includes(visibleStatus)
    ) {
      product.visibleStatus = visibleStatus;

      if (visibleStatus === "Rejected" && adminComment) {
        product.adminComment = adminComment;
      } else if (visibleStatus !== "Rejected") {
        product.adminComment = "";
      }
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product status and admin comment updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product status",
      error: error.message,
    });
  }
};

const searchProduct = async (req, res) => {
  try {
    const { query } = req.query;
    let filter = {};

    if (query) {
      filter = {
        $or: [
          { title: { $regex: new RegExp(query, "i") } },
          { category: { $regex: new RegExp(query, "i") } },
          { subcategory: { $regex: new RegExp(query, "i") } },
        ],
      };
    }

    const products = await Product.find(filter);

    return res.status(200).json({
      success: true,
      message: "Products found",
      data: products,
    });
  } catch (error) {
    console.error("Error searching products", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const getFilteredProducts = async (req, res) => {
  const filters = req.query;
  const { searchQuery } = req.query;
  const query = {};
  const sort = {};
  if (searchQuery) {
    const regex = new RegExp(searchQuery, "i");
    query.$or = [
      { title: { $regex: regex } },
      { category: { $regex: regex } },
      { subcategory: { $regex: regex } },
    ];
  }
  for (const key in filters) {
    const value = filters[key];

    if (key === "searchQuery") {
      continue;
    }
    if (key === "category") {
      query.category = value;
    } else if (key === "subcategory") {
      query.subcategory = value;
    } else if (key === "specificItem") {
      query.specificItem = value;
    } else if (key === "size") {
      query.size = value;
    } else if (key === "condition") {
      query.condition = value;
    } else if (key === "brand") {
      query.brand = value;
    }
    // else if (key === "color") {
    //   query.color = value;
    // }
    // else if (key === "material") {
    //   query.materials = value;
    // }
    else if (key === "price") {
      if (value == "Under DH100") {
        query.price = { $lt: 100 };
      } else if (value == "DH100 - DH200") {
        query.price = { $gte: 100, $lte: 200 };
      } else if (value == "Over DH200") {
        query.price = { $gt: 200 };
      }
    } else if (key === "sort") {
      if (value == "Low to High ") {
        sort.price = 1;
      } else if (value == "High to Low ") {
        sort.price = -1;
      }
    }
  }
  try {
    const products = await Product.find(query).sort(sort).populate("userId");
    res.status(200).json({
      success: true,
      message: "Filtered products retrieved",
      data: products,
    });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve filtered products",
      error: error.message,
    });
  }
};

const toggleSaveProduct = async (req, res) => {
  const { productId, userId } = req.params;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    const userLikeIndex = product.likes.indexOf(userId);
    let isLiked = false;
    let actionMessage = "";

    if (userLikeIndex === -1) {
      product.likes.push(userId);
      isLiked = true;
      actionMessage = "Added to Favourite";

      setTimeout(async () => {
        const sender = await User.findById(userId);

        const notificationEntry = new Notification({
          userId: userId,
          productId: productId,
          senderId: userId,
          message: `Reminder: You added ${product?.title} to your favorites.`,
          detail: `Complete your purchase before it's gone!`,
        });

        await notificationEntry.save();

        global.io.to(userId).emit("newNotification", {
          message: `Reminder: You added a product to favorites.`,
          userId: userId,
          senderId: {
            id: userId,
            avatar: sender?.avatar,
          },
          detail: `Check your favorites to complete your purchase.`,
          data: notificationEntry,
          time: new Date(),
        });
      }, 24 * 60 * 60 * 1000); // 24 hours
      // }, 5000); // 5 seconds
    } else {
      product.likes.splice(userLikeIndex, 1);
      isLiked = false;
      actionMessage = "Removed from Favourite";
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: actionMessage,
      isLiked,
      likesCount: product.likes.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to toggle like",
      error: error.message,
    });
  }
};

const getLikedProducts = async (req, res) => {
  const { userId } = req.params;
  const { limit = 20 } = req.query;

  try {
    const likedProducts = await Product.find({ likes: userId })
      .populate("userId")
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json({
      success: true,
      data: likedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get liked products",
      error: error.message,
    });
  }
};

const getProductsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const products = await Product.find({ userId }).populate("userId").exec();

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error retrieving products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve products",
      error: error.message,
    });
  }
};
const getSimilarProducts = async (req, res) => {
  const { productId } = req.params;

  try {
    const currentProduct = await Product.findById(productId)
      .populate("userId")
      .exec();

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const query = {
      category: currentProduct.category,
      subcategory: currentProduct.subcategory,
      _id: { $ne: productId },
    };

    if (currentProduct.specificItem) {
      query.specificItem = currentProduct.specificItem;
    }

    const similarProducts = await Product.find(query)
      .populate("userId")
      .limit(10)
      .exec();

    return res.status(200).json({
      success: true,
      data: similarProducts,
    });
  } catch (error) {
    console.error("Error retrieving similar products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve similar products",
      error: error.message,
    });
  }
};
const incrementViewCount = async (req, res) => {
  const { productId, userId } = req.params;

  try {
    const product = await Product.findById(productId).exec();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user has already viewed the product
    if (product.viewedBy.includes(userId)) {
      return res.status(200).json({
        success: true,
        viewCount: product.viewCount,
        message: "You have already viewed this product",
      });
    }

    // Increment view count and add user ID to viewedBy array
    product.viewCount += 1;
    product.viewedBy.push(userId); // Add user ID to the viewedBy array
    await product.save();

    return res.status(200).json({
      success: true,
      viewCount: product.viewCount,
      message: "View count updated successfully",
    });
  } catch (error) {
    console.error("Error updating view count:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update view count",
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getFilteredProducts,
  updateProductVerificationStatus,
  getAllVerifiedProducts,
  searchProduct,
  incrementViewCount,
  // getUserProjects,

  deleteProduct,
  updateProduct,
  getLikedProducts,
  getProductsByUserId,
  getProductById,
  getSimilarProducts,
  toggleSaveProduct,
};
