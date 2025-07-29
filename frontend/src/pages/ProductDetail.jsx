import { useParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart, syncCartToBackend } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [addingToCart, setAddingToCart] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/products/${id}/`);
        if (!response.ok) throw new Error('Product not found');
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Fetch related products after product is loaded
  useEffect(() => {
    const fetchRelated = async () => {
      if (!product || !product.category) return;
      try {
        const response = await fetch(`${API_BASE}/api/products/`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        // Filter by same category, exclude current product
        const related = data.filter(
          (p) => p.category === product.category && p.id !== product.id
        );
        setRelatedProducts(related);
      } catch (err) {
        setRelatedProducts([]);
      }
    };
    fetchRelated();
  }, [product, API_BASE]);

  const handleAddToCart = async () => {
    if (addingToCart) return; // Prevent multiple clicks
    
    setAddingToCart(true);
    try {
      addToCart(product);
      await syncCartToBackend();
      setAdded(true);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2500);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center">Loading...</div>;
  if (error || !product) return <div className="min-h-screen flex justify-center items-center">Product Not Found</div>;

  // Use the image URL directly from the API response
  const imageUrl = product.image;
  
  console.log('Product data:', product);
  console.log('Image URL from API:', product.image);

  return (
    <section className="min-h-screen py-16 px-4 mt-[20px] md:px-20 bg-gray-400 relative">
      {/* Popup Notification */}
      {showPopup && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full text-sm animate-fade-in-out shadow-lg z-30">
          <span className="font-semibold">{product.name}</span> is added to cart
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full rounded-3xl shadow-2xl"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 rounded-3xl flex items-center justify-center">
            <p className="text-gray-500">No image available</p>
          </div>
        )}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-black">{product.name}</h1>
          <div className="flex items-end gap-4">
            <span className="text-pink-600 font-bold text-2xl">-{product.discount_percent}%</span>
            <span className="text-black font-extrabold text-3xl">&#8377; {product.discounted_price}</span>
          </div>
          <div className="text-gray-500 text-base">
            M.R.P.: <span className="line-through">&#8377; {product.original_price}</span>
          </div>
          <p className="text-black">{product.description || 'This is a premium cosmetic product crafted for your beauty needs. Enjoy flawless results and gentle care with our formula.'}</p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className={`px-6 py-3 bg-black text-white rounded-full hover:bg-black/70 transition flex items-center gap-2 ${
                addingToCart ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {addingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                'Add to Cart'
              )}
            </button>

            {/* View Cart button → only visible if added */}
            {added && (
              <Link
                to="/cart"
                className="px-6 py-3 border-2 border-black text-black rounded-full hover:bg-black hover:text-white transition"
              >
                View Cart
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto mt-16">
          <h2 className="text-2xl font-bold mb-6 text-black">Related Products</h2>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {relatedProducts.map((rel) => (
              <Link
                to={`/product/${rel.id}`}
                key={rel.id}
                className="min-w-[220px] bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 flex-shrink-0"
              >
                <img
                  src={rel.image}
                  alt={rel.name}
                  className="w-full h-40 object-cover rounded-t-xl"
                />
                <div className="p-3">
                  <h3 className="font-semibold text-gray-800 text-base mb-1">{rel.name}</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-pink-600 font-bold text-lg">-{rel.discount_percent}%</span>
                    <span className="text-black font-extrabold text-xl">&#8377; {rel.discounted_price}</span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    M.R.P.: <span className="line-through">&#8377; {rel.original_price}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductDetail;
