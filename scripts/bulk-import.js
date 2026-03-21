const fs = require('fs');
const path = require('path');
const { storage } = require('../server/db-storage');

async function bulkImportFromCSV(filePath) {
  console.log('Starting bulk import from:', filePath);
  
  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Skip header if exists
    const startIndex = lines[0].includes('name') ? 1 : 0;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Simple CSV parsing (assuming comma-separated)
      const [name, category, price, unit, description, brand] = line.split(',').map(item => item.trim().replace(/"/g, ''));
      
      if (!name || !category || !price) {
        console.log(`Skipping invalid line ${i + 1}:`, line);
        errorCount++;
        continue;
      }
      
      try {
        await storage.createProduct({
          id: `bulk_${Date.now()}_${i}`,
          name: name,
          category: category.toLowerCase(),
          price: parseFloat(price) * 100, // Convert to cents
          unit: unit || 'pcs',
          image: '📦', // Default image
          rating: '4.0',
          description: description || `${name} - ${category}`,
          brand: brand || 'Generic',
          weight: '1 kg',
          inStock: true,
        });
        
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`Imported ${successCount} products...`);
        }
      } catch (error) {
        console.error(`Error importing product ${name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Import Complete!`);
    console.log(`✅ Successfully imported: ${successCount} products`);
    console.log(`❌ Failed to import: ${errorCount} products`);
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Example CSV format
function createExampleCSV() {
  const example = `name,category,price,unit,description,brand
Fresh Tomatoes,vegetables,50.00,kg,Fresh red tomatoes,Farm Fresh
Fresh Milk,dairy,120.00,L,Fresh cow's milk,DairyBest
Bread,bakery,25.00,pcs,Whole wheat bread,BakeHouse
Eggs,meat,80.00,dozen,Farm fresh eggs,EggFarm
`;
  
  fs.writeFileSync('products-example.csv', example);
  console.log('Created products-example.csv with sample data');
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

if (command === 'example') {
  createExampleCSV();
} else if (command === 'import' && args[1]) {
  bulkImportFromCSV(args[1]);
} else {
  console.log('Usage:');
  console.log('  node scripts/bulk-import.js example    # Create example CSV');
  console.log('  node scripts/bulk-import.js import <file.csv>  # Import from CSV');
  console.log('\nCSV Format: name,category,price,unit,description,brand');
}
