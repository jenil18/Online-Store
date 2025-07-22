  const Testimonial = () => {
  return (
    <section
      className="relative bg-fixed bg-center bg-cover h-screen overflow-hidden"
      style={{
        backgroundImage: `url('/images/lady-bgr-2.png')`, // put your background image in public/images
      }}
    >
      <div className="">
        <div className="max-w-3xl mx-auto text-center px-4 py-32">
          <p className="text-white uppercase tracking-wider font-medium mb-6">
            TESTIMONIALS
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
            OUR HAPPY CLIENTS
          </h2>
          <p className="text-lg text-white/90 mb-10 leading-relaxed">
            &quot;Lorem ipsum dolor, sit amet consectetur adipisicing elit. Assumenda repudiandae veniam necessitatibus accusamus magnam distinctio veritatis culpa id quos, minus ex facere tenetur, quia corrupti, consectetur neque error doloremque velit? Ea recusandae voluptatem alias, unde magnam nesciunt, sed quo, sint ullam autem vitae corporis esse eos rem! Accusamus rerum, qui assumenda laborum impedit magnam itaque aspernatur nobis. Unde, tempora aliquam itaque optio dolores saepe tenetur ab nisi&quot;
          </p>

          {/* Client Info */}
          <div className="flex flex-col items-center space-y-2">
            <img
              src="/images/client.jpg" // put testimonial client image in public/images
              alt="Client"
              className="w-16 h-16 rounded-full border-2 border-white"
            />
            <p className="text-white font-medium">Marilyn Keller</p>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 0, bottom: 0, padding: '8px', zIndex: 10 }} className="text-xs text-gray-400 select-none pointer-events-none">
        PC : makeupbyseemasaini/IG
      </div>
    </section>
  );
};

export default Testimonial;
