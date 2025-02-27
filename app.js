const { useState, useEffect, useRef } = React;

// CSS Library options
const cssLibraries = [
    { name: "None", cdn: null },
    { name: "Bootstrap", cdn: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" },
    { name: "Tailwind CSS", cdn: "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" },
    { name: "Material UI", cdn: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" },
    { name: "Bulma", cdn: "https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css" },
];

// Main App Component
function App() {
    const [prompt, setPrompt] = useState("");
    const [generatedCode, setGeneratedCode] = useState("");
    const [activeTab, setActiveTab] = useState("preview");
    const [loading, setLoading] = useState(false);
    const [selectedLibrary, setSelectedLibrary] = useState(cssLibraries[0]);
    const [error, setError] = useState(null);
    const previewRef = useRef(null);

    // Generate component based on prompt
    const generateComponent = async () => {
        if (!prompt.trim()) {
            setError("Please enter a description for the component");
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const libraryContext = selectedLibrary.name !== "None" 
                ? `Use ${selectedLibrary.name} for styling. ` 
                : "Use plain CSS for styling. ";
                
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are a React component generator. Create clean, functional React components based on user descriptions. ${libraryContext}

Important coding guidelines:
1. Always wrap JSX expressions in curly braces: {condition ? 'true-value' : 'false-value'}
2. Always use semicolons to terminate statements
3. Properly close all JSX tags
4. Use consistent quotes - prefer single quotes for strings in JavaScript and double quotes for HTML attributes
5. Ensure all brackets, parentheses, and quotes are properly balanced
6. Define all variables before use with const or let
7. For conditional classes, use a pattern like: className={condition ? 'active-class' : 'inactive-class'}
8. Avoid template literals inside JSX attributes when possible
9. Always define your component with a function declaration: function ComponentName() {...}
10. Return a single parent element from your component

Output only the complete, working React component code without any explanations or markdown.`
                    },
                    {
                        role: "user",
                        content: `Generate a React functional component that ${prompt}. Make sure the function is properly declared as a named function (function ComponentName() {}) and all JSX syntax is valid.`
                    }
                ]
            });
            
            // Clean the generated code
            const cleanedCode = completion.content
                .replace(/```jsx/g, '')
                .replace(/```javascript/g, '')
                .replace(/```react/g, '')
                .replace(/```/g, '')
                .trim();
                
            setGeneratedCode(cleanedCode);
            setLoading(false);
            setActiveTab("preview");
        } catch (err) {
            setError("Failed to generate component. Please try again.");
            setLoading(false);
        }
    };

    // Handle library change
    const handleLibraryChange = (e) => {
        const selected = cssLibraries.find(lib => lib.name === e.target.value);
        setSelectedLibrary(selected || cssLibraries[0]);
    };

    // Copy code to clipboard
    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedCode);
        // Show a temporary copied notification
        const copyBtn = document.querySelector('.copy-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.disabled = true;
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.disabled = false;
        }, 2000);
    };

    // Update preview when code changes
    useEffect(() => {
        if (generatedCode && previewRef.current) {
            try {
                // Clear the previous preview
                while (previewRef.current.firstChild) {
                    previewRef.current.removeChild(previewRef.current.firstChild);
                }

                // Create a new div for the component
                const componentContainer = document.createElement('div');
                previewRef.current.appendChild(componentContainer);

                // Add the selected CSS library if needed
                if (selectedLibrary.cdn) {
                    const existingLink = document.querySelector(`link[href="${selectedLibrary.cdn}"]`);
                    if (!existingLink) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = selectedLibrary.cdn;
                        document.head.appendChild(link);
                    }
                }

                // Improved code execution approach with additional syntax validation
                try {
                    // Basic syntax validation check before execution
                    new Function(generatedCode);
                    
                    const transpiledCode = Babel.transform(
                        `
                        const PreviewComponent = () => {
                            try {
                                // Execute the generated code in a function scope
                                let Component;
                                
                                (() => {
                                    ${generatedCode}
                                    
                                    // Look for component declaration patterns in the code
                                    // First try to find function ComponentName() {} pattern
                                    const functionRegex = /function\\s+([A-Za-z0-9_]+)\\s*\\(/;
                                    const functionMatch = ${JSON.stringify(generatedCode)}.match(functionRegex);
                                    
                                    // Then try to find const/let ComponentName = () => {} or const/let ComponentName = function() {} pattern
                                    const constRegex = /(?:const|let|var)\\s+([A-Za-z0-9_]+)\\s*=\\s*(?:function|\\()/;
                                    const constMatch = ${JSON.stringify(generatedCode)}.match(constRegex);
                                    
                                    if (functionMatch && functionMatch[1]) {
                                        // Function declaration found
                                        Component = eval(functionMatch[1]);
                                    } else if (constMatch && constMatch[1]) {
                                        // Const/let declaration found
                                        Component = eval(constMatch[1]);
                                    } else {
                                        // Default export or last defined function as fallback
                                        if (typeof App !== 'undefined') {
                                            Component = App;
                                        } else if (typeof Component !== 'undefined') {
                                            // Component is already defined
                                        } else {
                                            throw new Error("Could not find a component definition in the generated code");
                                        }
                                    }
                                })();
                                
                                return typeof Component === 'function' ? <Component /> : 
                                    <div className="alert alert-warning">
                                        Component not found in the generated code. Make sure your prompt generates a valid React component.
                                    </div>;
                            } catch (error) {
                                console.error("Component execution error:", error);
                                return (
                                    <div className="alert alert-danger">
                                        Error in component: {error.message}
                                        <br/>
                                        <small>Check the code tab and modify your prompt to fix this issue.</small>
                                    </div>
                                );
                            }
                        };
                        
                        try {
                            ReactDOM.render(<PreviewComponent />, componentContainer);
                        } catch (error) {
                            ReactDOM.render(
                                <div className="alert alert-danger">
                                    Error rendering component: {error.message}
                                    <br/>
                                    <small>Check the console for more details.</small>
                                </div>,
                                componentContainer
                            );
                        }
                        `,
                        { presets: ['react'] }
                    ).code;

                    // Execute the transpiled code
                    eval(transpiledCode);
                } catch (syntaxError) {
                    console.error("Syntax error in generated code:", syntaxError);
                    previewRef.current.innerHTML = `<div class="alert alert-danger">
                        Syntax error in generated code: ${syntaxError.message}
                        <br/>
                        <small>The generated code contains syntax errors. Try generating again with a more specific prompt.</small>
                    </div>`;
                }
            } catch (error) {
                console.error("Error rendering preview:", error);
                previewRef.current.innerHTML = `<div class="alert alert-danger">
                    Error rendering component: ${error.message}
                    <br/>
                    <small>This might be due to a syntax error in the generated code.</small>
                </div>`;
            }
        }
    }, [generatedCode, selectedLibrary]);

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="app-title">React Component Generator</h1>
                <h2 className="app-subtitle">Turn your text descriptions into working React components</h2>
            </header>

            <div className="form-container">
                <div className="mb-3">
                    <label htmlFor="promptInput" className="form-label fw-bold">Describe your component:</label>
                    <textarea 
                        id="promptInput"
                        className="form-control"
                        placeholder="e.g., creates a responsive navigation bar with a logo, links, and a dropdown menu"
                        rows="3"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>
                
                <div className="row mb-3">
                    <div className="col-md-6">
                        <label htmlFor="librarySelect" className="form-label fw-bold">CSS Library:</label>
                        <select 
                            id="librarySelect" 
                            className="form-select"
                            value={selectedLibrary.name}
                            onChange={handleLibraryChange}
                        >
                            {cssLibraries.map(lib => (
                                <option key={lib.name} value={lib.name}>{lib.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-6 d-flex align-items-end">
                        <button 
                            className="btn btn-primary w-100" 
                            onClick={generateComponent}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Generating...
                                </>
                            ) : "Generate Component"}
                        </button>
                    </div>
                </div>
                
                {error && <div className="alert alert-danger">{error}</div>}
                
                <div className="alert alert-info">
                    <strong>Tip:</strong> Be specific about what you want. For example, instead of "a navigation bar", try "a responsive navigation bar with a logo, 4 menu items, and a search button that collapses on mobile screens".
                </div>
            </div>

            {(generatedCode || loading) && (
                <div className="preview-container">
                    <ul className="nav nav-tabs" role="tablist">
                        <li className="nav-item" role="presentation">
                            <button 
                                className={`nav-link ${activeTab === 'preview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('preview')}
                            >
                                Preview
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button 
                                className={`nav-link ${activeTab === 'code' ? 'active' : ''}`}
                                onClick={() => setActiveTab('code')}
                            >
                                Code
                            </button>
                        </li>
                    </ul>
                    
                    <div className="tab-content">
                        <div className={`tab-pane fade ${activeTab === 'preview' ? 'show active' : ''}`}>
                            {loading ? (
                                <div className="loading-spinner">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="preview-area" ref={previewRef}></div>
                            )}
                        </div>
                        
                        <div className={`tab-pane fade ${activeTab === 'code' ? 'show active' : ''}`}>
                            {loading ? (
                                <div className="loading-spinner">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="position-relative">
                                    <button 
                                        className="btn btn-sm btn-outline-light copy-btn" 
                                        onClick={copyToClipboard}
                                    >
                                        Copy
                                    </button>
                                    <pre className="code-area">{generatedCode}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Render the App
ReactDOM.render(<App />, document.getElementById('app'));
