const dragDropZone = document.getElementById('dragDropZone');
const fileInput = document.getElementById('fileInput');
const uploadedImagePreview = document.getElementById('uploadedImagePreview');
const resultColumn = document.getElementById('resultColumn');
const detectedInfo = document.getElementById('detectedInfo');
const detectedTextSpan = document.getElementById('detectedText');
const progressBar = document.getElementById('progressBar');
const progress = progressBar.querySelector('.progress');
const sampleSelect = document.getElementById('sampleSelect');

dragDropZone.addEventListener('click', () => fileInput.click());
dragDropZone.addEventListener('dragover', (e) => e.preventDefault());
dragDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) showPreview(file);
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) showPreview(file);
});

// Handle sample image selection from dropdown
sampleSelect.addEventListener('change', async (e) => {
    const imageUrl = e.target.value;
    if (imageUrl) {
        try {
            // Fetch the selected sample image
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch image.');
            }
            const blob = await response.blob();
            
            // Create a file from the blob and pass it to showPreview function
            const file = new File([blob], imageUrl.split('/').pop(), { type: blob.type });
            showPreview(file);
        } catch (error) {
            console.error('Error fetching sample image:', error);
        }
    }
});

function showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImagePreview.src = e.target.result;
        uploadedImagePreview.style.display = 'block';
        handleUpload(file);
    };
    reader.readAsDataURL(file);
}

async function handleUpload(file) {
    const formData = new FormData();
    formData.append('image', file);

    resultColumn.innerHTML = ""; // Clear previous results
    detectedInfo.style.display = "none";
    progressBar.style.display = "block";
    progress.style.width = "0%";

    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    resultColumn.appendChild(loadingSpinner);  // Show loading spinner

    try {
        const response = await fetch('https://proxy-server-pvp1.onrender.com/api/detect_sendimg', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error uploading the image.');
        }

        const data = await response.json();
        loadingSpinner.style.display = 'none';  // Hide spinner

        progress.style.width = "25%";

        // Display stages with meaningful hover descriptions
        data.stages.forEach((stage, index) => {
            setTimeout(() => {
                const stageDiv = document.createElement('div');
                stageDiv.className = 'stage-card';

                const stageImage = document.createElement('img');
                stageImage.src = `data:image/png;base64,${stage.image}`;
                stageImage.alt = stage.title;

                const stageTitle = document.createElement('h4');
                stageTitle.textContent = stage.title;

                const hoverDescription = document.createElement('div');
                hoverDescription.className = 'hover-description';
                hoverDescription.textContent = stage.description;

                stageDiv.appendChild(stageImage);
                stageDiv.appendChild(stageTitle);
                stageDiv.appendChild(hoverDescription);
                resultColumn.appendChild(stageDiv);

                if (index < data.stages.length - 1) {
                    const arrow = document.createElement('div');
                    arrow.className = 'arrow';
                    arrow.textContent = '⬇';
                    resultColumn.appendChild(arrow);
                }

                progress.style.width = `${(50 + (index + 1) * (50 / data.stages.length))}%`;
            }, index * 1000);
        });

        // Show detected text after stages
        setTimeout(() => {
            detectedTextSpan.textContent = data.text;
            detectedInfo.style.display = "block";
            progressBar.style.display = "none";
        }, data.stages.length * 1000);
    } catch (error) {
        console.error('Error processing the image:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Error processing the image. Please try again later.';
        resultColumn.appendChild(errorDiv);
        progressBar.style.display = "none";
    }
}
