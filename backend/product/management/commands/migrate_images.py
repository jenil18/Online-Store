import os
import shutil
from django.core.management.base import BaseCommand
from django.conf import settings
from product.models import Product

class Command(BaseCommand):
    help = 'Migrate product images from frontend to backend and update product records'

    def handle(self, *args, **options):
        # Define source and destination paths
        frontend_images_dir = os.path.join(settings.BASE_DIR.parent, 'frontend', 'public', 'images')
        backend_products_dir = os.path.join(settings.MEDIA_ROOT, 'products')
        
        # Create backend products directory if it doesn't exist
        os.makedirs(backend_products_dir, exist_ok=True)
        
        # Get all products from database
        products = Product.objects.all()
        
        migrated_count = 0
        errors = []
        
        for product in products:
            try:
                # Check if product has an image field
                if hasattr(product, 'image') and product.image:
                    # If product already has an image, skip
                    if product.image.name and os.path.exists(product.image.path):
                        self.stdout.write(f"Product '{product.name}' already has image: {product.image.name}")
                        continue
                
                # Look for image in frontend directory
                image_name = f"{product.name.lower().replace(' ', '_')}.jpg"
                image_paths_to_try = [
                    os.path.join(frontend_images_dir, image_name),
                    os.path.join(frontend_images_dir, f"{product.name.lower().replace(' ', '_')}.png"),
                    os.path.join(frontend_images_dir, f"{product.name.lower().replace(' ', '_')}.jpeg"),
                    os.path.join(frontend_images_dir, f"{product.name.lower().replace(' ', '_')}.webp"),
                ]
                
                source_image_path = None
                for path in image_paths_to_try:
                    if os.path.exists(path):
                        source_image_path = path
                        break
                
                if source_image_path:
                    # Copy image to backend
                    filename = os.path.basename(source_image_path)
                    destination_path = os.path.join(backend_products_dir, filename)
                    
                    shutil.copy2(source_image_path, destination_path)
                    
                    # Update product record
                    relative_path = f'products/{filename}'
                    product.image = relative_path
                    product.save()
                    
                    migrated_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"Migrated image for '{product.name}': {relative_path}")
                    )
                else:
                    # Create a default image path for products without images
                    default_image_path = f'products/default_{product.name.lower().replace(" ", "_")}.jpg'
                    product.image = default_image_path
                    product.save()
                    
                    self.stdout.write(
                        self.style.WARNING(f"No image found for '{product.name}', set default path: {default_image_path}")
                    )
                    
            except Exception as e:
                error_msg = f"Error migrating image for '{product.name}': {str(e)}"
                errors.append(error_msg)
                self.stdout.write(self.style.ERROR(error_msg))
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS(f"\nMigration completed!")
        )
        self.stdout.write(f"Successfully migrated: {migrated_count} images")
        if errors:
            self.stdout.write(f"Errors: {len(errors)}")
            for error in errors:
                self.stdout.write(self.style.ERROR(f"  - {error}")) 