createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    
    card.innerHTML = `
        <div class="card-content">
            <div class="card-header">
                <h3>${job.title}</h3>
                <div class="job-meta">
                    <span class="company">${job.company}</span>
                    <span class="separator">•</span>
                    <span class="salary-range">${job.salaryRange}</span>
                    <span class="separator">•</span>
                    <span class="job-type">${job.jobType}</span>
                </div>
            </div>
            <ul class="requirements">
                ${job.requirements.map(req => `<li>${req}</li>`).join('')}
            </ul>
        </div>
        <div class="card-actions">
            <a href="${job.applyUrl}" class="job-link" target="_blank" rel="noopener noreferrer">Apply Now</a>
            <button class="mark-button" data-url="${job.applyUrl}" title="Mark as Reviewed">
                <span class="button-light"></span>
            </button>
        </div>
    `;

    const markButton = card.querySelector('.mark-button');
    markButton.addEventListener('click', () => this.markJob(job.applyUrl));

    this.jobsContainer.appendChild(card);
}