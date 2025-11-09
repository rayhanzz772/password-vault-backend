/**
 * Tags Bulk Operations Test Examples
 * 
 * This file contains example requests for testing the tags bulk operations.
 * You can use these with REST clients like Postman, Insomnia, or curl.
 */

// =============================================================================
// SETUP
// =============================================================================

const BASE_URL = 'http://localhost:5000/api/tags';
const AUTH_TOKEN = 'your_jwt_token_here'; // Replace with your actual token

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

// =============================================================================
// BULK CREATE EXAMPLES
// =============================================================================

/**
 * Example 1: Bulk Create Tags - Basic
 * Creates multiple tags at once
 */
async function bulkCreateBasic() {
  const response = await fetch(`${BASE_URL}/bulk`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tags: ['Work', 'Personal', 'Important', 'Urgent', 'Archive']
    })
  });
  
  const data = await response.json();
  console.log('Bulk Create Basic:', data);
  
  /*
  Expected Response:
  {
    "success": true,
    "message": "5 tags created successfully",
    "data": {
      "created": [
        { "id": "tag1", "name": "Work", "createdAt": "..." },
        { "id": "tag2", "name": "Personal", "createdAt": "..." },
        ...
      ],
      "skipped": [],
      "summary": {
        "total": 5,
        "created": 5,
        "skipped": 0
      }
    }
  }
  */
}

/**
 * Example 2: Bulk Create with Duplicates
 * Automatically handles duplicate tags
 */
async function bulkCreateWithDuplicates() {
  const response = await fetch(`${BASE_URL}/bulk`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tags: [
        'Work',        // Might exist
        'Personal',    // Might exist
        'NewTag1',     // New
        'NewTag2',     // New
        'Important'    // Might exist
      ]
    })
  });
  
  const data = await response.json();
  console.log('Bulk Create with Duplicates:', data);
  
  /*
  Expected Response:
  {
    "success": true,
    "message": "2 tags created successfully",
    "data": {
      "created": [
        { "id": "tag6", "name": "NewTag1", "createdAt": "..." },
        { "id": "tag7", "name": "NewTag2", "createdAt": "..." }
      ],
      "skipped": [
        { "id": "tag1", "name": "Work", "reason": "already exists" },
        { "id": "tag2", "name": "Personal", "reason": "already exists" },
        { "id": "tag3", "name": "Important", "reason": "already exists" }
      ],
      "summary": {
        "total": 5,
        "created": 2,
        "skipped": 3
      }
    }
  }
  */
}

/**
 * Example 3: Bulk Create from Array
 * Useful when importing tags from a file or form
 */
async function bulkCreateFromArray() {
  const userTags = [
    'Project Alpha',
    'Project Beta',
    'Client Meeting',
    'Review Required',
    'Follow Up'
  ];
  
  const response = await fetch(`${BASE_URL}/bulk`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tags: userTags })
  });
  
  const data = await response.json();
  console.log('Bulk Create from Array:', data);
  return data;
}

// =============================================================================
// BULK UPDATE EXAMPLES
// =============================================================================

/**
 * Example 4: Bulk Update Tags
 * Update multiple tag names at once
 */
async function bulkUpdateTags() {
  const response = await fetch(`${BASE_URL}/bulk`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      tags: [
        { id: 'tag1', name: 'Work Projects' },
        { id: 'tag2', name: 'Personal Notes' },
        { id: 'tag3', name: 'High Priority' }
      ]
    })
  });
  
  const data = await response.json();
  console.log('Bulk Update:', data);
  
  /*
  Expected Response:
  {
    "success": true,
    "message": "3 tags updated successfully",
    "data": {
      "updated": [
        { "id": "tag1", "name": "Work Projects", "updatedAt": "..." },
        { "id": "tag2", "name": "Personal Notes", "updatedAt": "..." },
        { "id": "tag3", "name": "High Priority", "updatedAt": "..." }
      ],
      "failed": [],
      "summary": {
        "total": 3,
        "updated": 3,
        "failed": 0
      }
    }
  }
  */
}

/**
 * Example 5: Bulk Update with Conflict Handling
 * Shows how conflicts are handled
 */
async function bulkUpdateWithConflicts() {
  const response = await fetch(`${BASE_URL}/bulk`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      tags: [
        { id: 'tag1', name: 'Updated Name 1' },
        { id: 'tag2', name: 'Work Projects' }, // Might conflict with existing
        { id: 'tag3', name: 'Updated Name 3' }
      ]
    })
  });
  
  const data = await response.json();
  console.log('Bulk Update with Conflicts:', data);
  
  /*
  Expected Response:
  {
    "success": true,
    "message": "2 tags updated successfully",
    "data": {
      "updated": [
        { "id": "tag1", "name": "Updated Name 1", "updatedAt": "..." },
        { "id": "tag3", "name": "Updated Name 3", "updatedAt": "..." }
      ],
      "failed": [
        { "id": "tag2", "name": "Work Projects", "reason": "Name already exists" }
      ],
      "summary": {
        "total": 3,
        "updated": 2,
        "failed": 1
      }
    }
  }
  */
}

// =============================================================================
// BULK DELETE EXAMPLES
// =============================================================================

/**
 * Example 6: Bulk Delete Tags
 * Delete multiple tags at once
 */
async function bulkDeleteTags() {
  const response = await fetch(`${BASE_URL}/bulk`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({
      ids: ['tag1', 'tag2', 'tag3']
    })
  });
  
  const data = await response.json();
  console.log('Bulk Delete:', data);
  
  /*
  Expected Response:
  {
    "success": true,
    "message": "3 tags deleted successfully",
    "data": {
      "deleted": [
        { "id": "tag1", "name": "Work Projects" },
        { "id": "tag2", "name": "Personal Notes" },
        { "id": "tag3", "name": "High Priority" }
      ],
      "notesAffected": 12,
      "summary": {
        "requested": 3,
        "deleted": 3,
        "notFound": 0
      }
    }
  }
  */
}

/**
 * Example 7: Bulk Delete with Cleanup
 * Shows how notes are automatically cleaned up
 */
async function bulkDeleteWithCleanup() {
  // First, create some tags
  await fetch(`${BASE_URL}/bulk`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tags: ['TempTag1', 'TempTag2', 'TempTag3']
    })
  });
  
  // Get the created tag IDs (assume we know them)
  const tagIds = ['tempTag1Id', 'tempTag2Id', 'tempTag3Id'];
  
  // Delete them
  const response = await fetch(`${BASE_URL}/bulk`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ ids: tagIds })
  });
  
  const data = await response.json();
  console.log('Bulk Delete with Cleanup:', data);
  console.log(`Cleaned up ${data.data.notesAffected} notes`);
}

// =============================================================================
// COMBINED WORKFLOWS
// =============================================================================

/**
 * Example 8: Import Tags from CSV
 * Simulate importing tags from a CSV file
 */
async function importTagsFromCSV() {
  // Simulate CSV data
  const csvData = `
Work
Personal
Important
Urgent
Review
Archive
Client Meeting
Project Alpha
  `.trim().split('\n').map(tag => tag.trim()).filter(Boolean);
  
  console.log('Importing tags:', csvData);
  
  const response = await fetch(`${BASE_URL}/bulk`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tags: csvData })
  });
  
  const data = await response.json();
  console.log('Import Result:', data);
  console.log(`Created: ${data.data.summary.created}, Skipped: ${data.data.summary.skipped}`);
  
  return data;
}

/**
 * Example 9: Rename Multiple Tags
 * Rename tags following a pattern
 */
async function renameMultipleTags() {
  // Get all tags first
  const getAllResponse = await fetch(`${BASE_URL}`, { headers });
  const allTags = await getAllResponse.json();
  
  // Add prefix to all tags
  const updatedTags = allTags.data.map(tag => ({
    id: tag.id,
    name: `[2025] ${tag.name}`
  }));
  
  const response = await fetch(`${BASE_URL}/bulk`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ tags: updatedTags })
  });
  
  const data = await response.json();
  console.log('Rename Result:', data);
  return data;
}

/**
 * Example 10: Clean Up Unused Tags
 * Delete all tags that have no associated notes
 */
async function cleanupUnusedTags() {
  // Get all tags
  const response = await fetch(`${BASE_URL}`, { headers });
  const { data: tags } = await response.json();
  
  // Find tags with no notes
  const unusedTags = tags.filter(tag => tag.noteCount === 0);
  const unusedTagIds = unusedTags.map(tag => tag.id);
  
  console.log(`Found ${unusedTags.length} unused tags:`, unusedTags.map(t => t.name));
  
  if (unusedTagIds.length === 0) {
    console.log('No unused tags to delete');
    return;
  }
  
  // Delete unused tags
  const deleteResponse = await fetch(`${BASE_URL}/bulk`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ ids: unusedTagIds })
  });
  
  const result = await deleteResponse.json();
  console.log('Cleanup Result:', result);
  return result;
}

// =============================================================================
// CURL COMMANDS FOR TESTING
// =============================================================================

/*
# Bulk Create Tags
curl -X POST http://localhost:5000/api/tags/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["Work", "Personal", "Important", "Urgent", "Archive"]
  }'

# Bulk Update Tags
curl -X PUT http://localhost:5000/api/tags/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": [
      {"id": "tag123", "name": "Work Projects"},
      {"id": "tag124", "name": "Personal Notes"}
    ]
  }'

# Bulk Delete Tags
curl -X DELETE http://localhost:5000/api/tags/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["tag123", "tag124", "tag125"]
  }'

# Get All Tags with Search
curl -X GET "http://localhost:5000/api/tags?search=work&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
*/

// =============================================================================
// EXPORT FOR USE IN TESTS
// =============================================================================

module.exports = {
  bulkCreateBasic,
  bulkCreateWithDuplicates,
  bulkCreateFromArray,
  bulkUpdateTags,
  bulkUpdateWithConflicts,
  bulkDeleteTags,
  bulkDeleteWithCleanup,
  importTagsFromCSV,
  renameMultipleTags,
  cleanupUnusedTags
};
