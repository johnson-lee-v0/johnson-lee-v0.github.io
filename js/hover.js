const containers = document.querySelectorAll(".timeline-event");

containers.forEach(container => {
    const paragraphs = container.querySelectorAll("p");
    
    paragraphs.forEach(paragraph => {
        const originalText = paragraph.textContent;
        let timeoutId;
        
        if (paragraph.id) {
            container.addEventListener("mouseover", function() {
                if (paragraph.id === "event1") {
                    paragraph.innerHTML = `
                    <ul>
                    <li>Served over 400 clients by processing over $100mm worth of mortgages with ~100% accuracy in high volume and time-sensitive environment using SAP systems (LINX) and Excel in the reviewing process</li>
                    <li>Processed a variety of products consisting of credit lines, mortgages, limit increases and skipped payments</li>
                    <li>Ensured all required documentation and support details for each client were accurate, complete, and communicated with lenders when verification was needed</li>
                    </ul>
                    `;
                } else if (paragraph.id === "event2") {
                    paragraph.innerHTML = `
                    <ul>
                    <li>Worked closely with ~20 individuals from the Portfolio Advisory Group to support over 1,900+ investment advisors who manages more than $400 billion in AUM concerning their clients’ portfolio</li>
                    <li>Conducted research and read reports from research providers like JP Morgan, RBC, Veritas, Fundstrat covering investment strategies, company events, macro news to answer questions from investment advisors on a daily basis</li>
                    <li>Compiled data from multiple data source including Bloomberg, FactSet, RBC Capital Markets’ research reports to support investment advisors in monitoring their holdings, investment decisions, client meetings</li>
                    <li>Analyzed several multi-million dollar portfolios consisting of stocks, ETFs, notes and other securities</li>
                    </ul>
                    `;
                } else if (paragraph.id === "event3") {
                    paragraph.innerHTML = `
                    <ul>
                    <li>Worked alongside the Client Consulting team to advise large institutional investors in Canada with multi-million dollar DB/DC plans</li>
                    <li>Drafted economic and market analysis of North American and Overseas equity market conditions for Quarterly Capital Markets Review distributed to all Canadian Investment clients</li>
                    <li>Assisted in the manager search process by conducting primary research to understand managers’ investment philosophy, performance and structure; findings were reported directly to the consultants</li>
                    </ul>
                    `;
                } else if (paragraph.id === "event4") {
                    paragraph.innerHTML = `
                    <ul>
                    <li>Worked with consultants to provide North American Financial Institutions with strategic advice based on Data</li>
                    <li>Contributed to the development of version 3 of the marketing mix model pipeline by updating deprecated functions, rewriting portions of the code to remove repetitive data and speed up run time</li>
                    <li>Analyzed deposit data from major American FIs and FRED indicators to identify key drivers of deposit in bank to enhance existing marketing model</li>
                    <li>Created performance readout using Python and SQL for the firm’s AI/ML marketing platform Amplero, showcasing the incremental sales impact and customer retention attained through the platform</li>
                    </ul>
                    `;
                } else if (paragraph.id === "event5") {
                    paragraph.innerHTML = `
                    <ul>
                    <li>Worked with the Digital Experience team to launch the front-end of the Digital Bank for US Cash Management</li>
                    <li>Collaborated with Release Train Engineer and Scrum Master to oversee the progress of squads during sprints, leading to a notable 15% improvement in efficiency.</li>
                    <li>Partnered with the QA team to establish a comprehensive QA process to ensure features are built correctly and design matches those in Figma. More than 100+ manual and automated test cases were generated, resulting in the successful launch of the digital bank within the target timeline</li>
                    </ul>
                    `;
                }
                // add more else-if statements for each ID as needed
            });
            
            container.addEventListener("mouseout", function() {
                timeoutId = setTimeout(() => {
                    paragraph.textContent = originalText;
                }, 5000);
            });
        }
    });
});



//Part of the US Cash Management Team that is launching a digital bank to target a $100 billion market