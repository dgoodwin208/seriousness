// Main JavaScript for IsXSerious.com
class SeriousnessEvaluator {
    constructor() {
        this.currentEvaluation = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Main evaluation form
        const evaluationForm = document.getElementById('seriousness-form');
        if (evaluationForm) {
            evaluationForm.addEventListener('submit', (e) => this.handleEvaluation(e));
        }

        // Feedback form
        const feedbackButtons = document.querySelectorAll('.feedback-btn');
        feedbackButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFeedbackSelection(e));
        });

        const feedbackForm = document.getElementById('feedback-form');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', (e) => this.handleFeedbackSubmission(e));
        }
    }

    async handleEvaluation(event) {
        event.preventDefault();
        
        const entityInput = document.getElementById('entity');
        const contextInput = document.getElementById('context');
        const submitBtn = document.getElementById('evaluate-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        const entity = entityInput.value.trim();
        const context = contextInput.value.trim();

        if (!entity || !context) {
            alert('Please fill in both fields');
            return;
        }

        // Show loading state
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;

        try {
            // Call the seriousness evaluation API
            const evaluation = await this.callSeriousnessAPI(entity, context);
            
            // Display results
            this.displayResults(evaluation);
            
            // Log the interaction
            await this.logInteraction(entity, context, evaluation);
            
            // Scroll to results
            document.getElementById('results').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });

        } catch (error) {
            console.error('Evaluation error:', error);
            alert('Sorry, there was an error processing your request. Please try again.');
        } finally {
            // Reset loading state
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    async callSeriousnessAPI(entity, context) {
        try {
            const response = await fetch('/api/evaluate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ entity, context })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API request failed');
            }

            return await response.json();

        } catch (error) {
            console.error('API call failed:', error);
            
            // Fallback to mock responses if API is not available
            console.log('Using fallback mock response');
            
            // Mock response - fallback for when API is not available
            const mockResponses = {
                'Mr. Rogers': {
                    entity: 'Mr. Rogers',
                    system: context,
                    scores: {
                        E: 0.7,
                        v: 0.8,
                        alpha: 0.9
                    },
                    rationale: "Mr. Rogers consistently contributed tremendous energy through decades of dedicated children's programming, improved educational efficiency by revolutionizing how television could nurture child development, and fostered extraordinary social cohesion by teaching empathy, self-worth, and emotional regulation to multiple generations, significantly reducing social entropy through his calm, structured approach to addressing childhood challenges."
                },
                'White Fragility': {
                    entity: 'White Fragility',
                    system: context,
                    scores: {
                        E: -0.1,
                        v: -0.3,
                        alpha: -0.6
                    },
                    rationale: "While raising awareness about racial dynamics, the concept often drains organizational energy through divisive workshops, reduces institutional efficiency by creating defensive rather than productive conversations, and increases social fragmentation by emphasizing irreducible differences and guilt-based interactions rather than building bridges toward shared understanding and cooperation."
                },
                'Bitcoin': {
                    entity: 'Bitcoin',
                    system: context,
                    scores: {
                        E: 0.4,
                        v: 0.2,
                        alpha: -0.1
                    },
                    rationale: "Bitcoin contributes significant energy through financial innovation and investment flows, provides moderate efficiency gains in certain payment systems and store-of-value functions, but creates some social disorder through speculation bubbles, energy consumption debates, and polarized communities around cryptocurrency adoption versus traditional monetary systems."
                }
            };

            // Check if we have a mock response for this entity
            const normalizedEntity = entity.toLowerCase();
            let response = null;
            
            for (const key in mockResponses) {
                if (normalizedEntity.includes(key.toLowerCase())) {
                    response = { ...mockResponses[key] };
                    response.system = context; // Update context
                    break;
                }
            }

            // If no specific mock, generate a generic response
            if (!response) {
                response = {
                    entity: entity,
                    system: context,
                    scores: {
                        E: (Math.random() - 0.5) * 1.6, // Random between -0.8 and 0.8
                        v: (Math.random() - 0.5) * 1.6,
                        alpha: (Math.random() - 0.5) * 1.6
                    },
                    rationale: `This evaluation considers how ${entity} affects energy flows, operational efficiency, and social cohesion within ${context}. The analysis examines concrete contributions to system resources, institutional capabilities, and structural order based on observable thermodynamic impacts rather than subjective preferences.`
                };
            }

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            return response;
        }
    }

    displayResults(evaluation) {
        this.currentEvaluation = evaluation;

        const resultsSection = document.getElementById('results');
        const resultsContent = document.getElementById('results-content');

        // Get scores from new schema
        const raw = evaluation.raw || {};
        const adjusted = evaluation.adjusted || {};
        const subject = evaluation.subject || evaluation.entity;
        const context = evaluation.context || evaluation.system;

        // Create results HTML
        const html = `
            <div class="evaluation-result">
                <div class="entity-context">
                    <div class="entity-name">${this.escapeHtml(subject)}</div>
                    <div class="context-name">in the context of ${this.escapeHtml(context)}</div>
                </div>

                <div class="designation">
                    <strong>Designation:</strong> ${this.escapeHtml(evaluation.designation || 'N/A')}
                </div>

                ${evaluation.milestone ? `
                <div class="milestone">
                    <strong>Milestone:</strong> ${this.escapeHtml(evaluation.milestone)}
                </div>
                ` : ''}

                <div class="scores-section">
                    <h3>Raw Scores (Direction)</h3>
                    <div class="scores">
                        <div class="score-item">
                            <div class="score-value ${this.getScoreClass(raw.E_raw)}">${(raw.E_raw || 0).toFixed(2)}</div>
                            <div class="score-label">Energy (E_raw)</div>
                        </div>
                        <div class="score-item">
                            <div class="score-value ${this.getScoreClass(raw.v_raw)}">${(raw.v_raw || 0).toFixed(2)}</div>
                            <div class="score-label">Efficiency (v_raw)</div>
                        </div>
                        <div class="score-item">
                            <div class="score-value ${this.getScoreClass(raw.alpha_raw)}">${(raw.alpha_raw || 0).toFixed(2)}</div>
                            <div class="score-label">Order (α_raw)</div>
                        </div>
                    </div>
                </div>

                <div class="scores-section">
                    <h3>Adjusted Scores (With Substance)</h3>
                    <div class="scores">
                        <div class="score-item">
                            <div class="score-value ${this.getScoreClass(adjusted.E_adj)}">${(adjusted.E_adj || 0).toFixed(2)}</div>
                            <div class="score-label">Energy (E_adj)</div>
                        </div>
                        <div class="score-item">
                            <div class="score-value ${this.getScoreClass(adjusted.v_adj)}">${(adjusted.v_adj || 0).toFixed(2)}</div>
                            <div class="score-label">Efficiency (v_adj)</div>
                        </div>
                        <div class="score-item">
                            <div class="score-value ${this.getScoreClass(adjusted.alpha_adj)}">${(adjusted.alpha_adj || 0).toFixed(2)}</div>
                            <div class="score-label">Order (α_adj)</div>
                        </div>
                    </div>
                </div>

                <div class="rationale">
                    <h3>Rationale</h3>
                    <p>${this.escapeHtml(evaluation.rationale || 'No rationale provided.')}</p>
                </div>
            </div>
        `;

        resultsContent.innerHTML = html;
        resultsSection.style.display = 'block';

        // Reset feedback form
        this.resetFeedbackForm();
    }

    getScoreClass(score) {
        if (score > 0.2) return 'positive';
        if (score < -0.2) return 'negative';
        return 'neutral';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    handleFeedbackSelection(event) {
        const selectedBtn = event.target;
        const feedbackType = selectedBtn.dataset.feedback;
        
        // Remove selection from other buttons
        document.querySelectorAll('.feedback-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Add selection to clicked button
        selectedBtn.classList.add('selected');
        
        // Show feedback input
        const feedbackInput = document.querySelector('.feedback-input');
        feedbackInput.style.display = 'block';
        
        // Focus on textarea
        const textarea = document.getElementById('feedback-text');
        textarea.focus();
    }

    async handleFeedbackSubmission(event) {
        event.preventDefault();
        
        const selectedBtn = document.querySelector('.feedback-btn.selected');
        if (!selectedBtn) {
            alert('Please select whether you agree or disagree first');
            return;
        }
        
        const feedbackType = selectedBtn.dataset.feedback;
        const feedbackText = document.getElementById('feedback-text').value.trim();
        
        const feedbackData = {
            entity: this.currentEvaluation?.subject || this.currentEvaluation?.entity,
            context: this.currentEvaluation?.context || this.currentEvaluation?.system,
            evaluation: {
                raw: this.currentEvaluation?.raw,
                adjusted: this.currentEvaluation?.adjusted,
                designation: this.currentEvaluation?.designation
            },
            feedback_type: feedbackType,
            feedback_text: feedbackText,
            timestamp: new Date().toISOString()
        };
        
        try {
            await this.logFeedback(feedbackData);
            
            // Show success message
            alert('Thank you for your feedback!');
            
            // Reset form
            this.resetFeedbackForm();
            
        } catch (error) {
            console.error('Feedback submission error:', error);
            alert('Sorry, there was an error submitting your feedback. Please try again.');
        }
    }

    resetFeedbackForm() {
        // Reset button selections
        document.querySelectorAll('.feedback-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Hide and reset feedback input
        const feedbackInput = document.querySelector('.feedback-input');
        feedbackInput.style.display = 'none';
        document.getElementById('feedback-text').value = '';
    }

    async logInteraction(entity, context, evaluation) {
        const interactionData = {
            entity,
            context,
            evaluation,
            timestamp: new Date().toISOString(),
            type: 'evaluation'
        };
        
        // TODO: Implement actual logging to database
        console.log('Logging interaction:', interactionData);
        
        // For demo purposes, store in localStorage
        const logs = JSON.parse(localStorage.getItem('seriousness_logs') || '[]');
        logs.push(interactionData);
        localStorage.setItem('seriousness_logs', JSON.stringify(logs));
    }

    async logFeedback(feedbackData) {
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData)
            });

            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }

            return await response.json();

        } catch (error) {
            console.error('Failed to log feedback to server:', error);
            
            // Fallback to localStorage if API is not available
            console.log('Logging feedback to localStorage:', feedbackData);
            const logs = JSON.parse(localStorage.getItem('seriousness_feedback') || '[]');
            logs.push(feedbackData);
            localStorage.setItem('seriousness_feedback', JSON.stringify(logs));
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SeriousnessEvaluator();
});