import React, { useState} from 'react';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { CircularProgressbar } from 'react-circular-progressbar';
//import ReactFormInputValidation from "react-form-input-validation";
import 'react-circular-progressbar/dist/styles.css';
import './css/custom.css';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './css/custom.css'

// import { easeQuadInOut } from "d3-ease";
// import AnimatedProgressProvider from "./AnimatedProgressProvider.js";
const validationSchema = Yup.object().shape({
  textAreaField: Yup.string().required('This field is required.')
    .test('len', 'Must be 1000 characters or More', (val) => 
      val ? val.length >= 1000 : true),
});
function Home() {
  const [inputText, setInputText] = useState();
  const [aiPercentage, setAiPercentage] = useState(0);
  const [humanPercentage, setHumanPercentage] = useState(0);
  const [classification, setClassification] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
   
  const handleMessageChange = (e) =>{
      const data = e.target.value;
      setInputText(data);
  }
  const handleSubmit = async (e) => { 
      setInputText(e.textAreaField);
      fetchData();
  }
  async function fetchData()
  {
    setIsLoading(true);
    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Authorization': 'Bearer sess-1vRGUNY2L9KMl0HqhqZvAbUJsW7yTv9OIrumtc6M',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Origin': 'https://platform.openai.com',
        'Referer': 'https://platform.openai.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
      },
      body: JSON.stringify({
        'prompt': inputText + "».\n<|disc_score|>",
        'max_tokens': 1,
        'temperature': 1,
        'top_p': 1,
        'n': 1,
        'logprobs': 5,
        'stop': '\n',
        'stream': false,
        'model': 'model-detect-v2',
      })
    });
    if (response.status == 200) {
    
      const responseJson = await response.json();
      const choices = responseJson.choices[0];
      const logprobs = choices.logprobs.top_logprobs[0];  
      const probs = {};
      for (const [key, value] of Object.entries(logprobs)) {
        probs[key] = 100 * Math.exp(value);            
      }
       console.log(probs);
      const possibleClasses = ['very unlikely', 'unlikely', 'unclear if it is', 'possibly', 'likely'];
      const classMax = [10, 45, 90, 98, 99];
      var keyProb = probs['"'];
    
      let classLabel = '';
      if (classMax[0] < keyProb && keyProb < classMax[classMax.length - 1]) {
        const val = Math.max(...classMax.filter(i => i < keyProb));
        classLabel = possibleClasses[classMax.indexOf(val) + 1];
      } else if (keyProb < classMax[0]) {
        classLabel = possibleClasses[0];
      } else {
        classLabel = possibleClasses[possibleClasses.length - 1];
      }
   
      const humanPercentage = Math.round(100 - keyProb);
      const aiPercentage = Math.round(keyProb);
      setAiPercentage(aiPercentage);
      setHumanPercentage(humanPercentage);
      const topProb = { Class: classLabel };
      setClassification(topProb);
      setIsLoading(false);
      setShowResult(true); 
    
    }
  }
 
  return (
    <div className='full mb-5 mt-4 w-75 m-auto min_height'>
      <>
        <h2 className='my-3 text-center'>Content Detector</h2>
        <div className='row d-flex align-items-center justify-content-between'>
          <div className='col-2'>
            <div style={{ height: 300 }}>
              <h3 className='text-center'>AI </h3>
              
              <CircularProgressbar value={aiPercentage} text={aiPercentage + "%"} strokeWidth={8} styles={{
                path: {
                  stroke: 'blue',
                  transition: 'stroke-dashoffset 0.5s ease 0s'
                }
              }} />
            </div>
          </div>
          <div className='col-8'>
            <Formik
              initialValues={{ textAreaField: '', }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}>
              {({ errors, touched }) => (
                <Form >
                  <div className=''>
                    <div className="form-group">
                      <Field name="textAreaField" as="textarea" rows="12" className="w-100" onKeyUp={handleMessageChange} placeholder="Paste your content here...." ></Field>
                      {errors.textAreaField && touched.textAreaField && (
                       <p className='error'> <ErrorMessage name="textAreaField"/></p>
                      )}
                    </div>
                    <div className='mt-2'>
                      {isLoading ? (<Button variant="primary"  className='btn btn-dark hover-overlay'> Loading ...</Button>
                      ) : (<Button variant="primary" className='btn btn-dark hover-overlay' type="submit">Detect</Button>
                      )}
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
          <div className='col-2'>
            <div style={{ height: 300 }}>
              <h3 className='text-center'>Human</h3>
              <CircularProgressbar value={humanPercentage} text={humanPercentage + "%"} strokeWidth={8} styles={{
                path: {
                  stroke: 'green'
                }
              }} />
            </div>
          </div>
        </div>
      </>
      <div>
        {showResult ? <div className='p-2 rounded text-light mt-5 m-auto text-center bg-primary w-50'>
          {classification && (
            <p className='m-0' style={{ fontSize:'12px'}}>The text is classified as: {classification.Class}</p>
          )}
        </div> : ''}
      </div>
    </div>

<div style={{ margin: "0 auto", width: "60%" }}>
        <h2 style={{ textAlign: "center" }}>
          ZeroGPT.cc: Use the Best Free AI Text Detector for Accurate Results
        </h2>
      </div>
      <div style={{ margin: "0 auto", width: "60%" }}>
        <Card className="shadow-lg">
          <Card.Body className="blur">
            <Card.Title className="text-center">
              AI Content Detector and Its Use
            </Card.Title>
            <Card.Text>
              Recent years have witnessed more and more AI-generated content in social media, marketing, and academic fields. This has led to the questioning of the authenticity and originality of the produced or published content. As a result, creativity, innovation, and dedication to one’s work are slowly losing their importance. This not just degrades the brand’s or institution’s image but also provokes judgment on the individual’s capabilities.
            </Card.Text>
            <Card.Text>
              AI text detectors have come as an aid in detecting AI-generated content. With the use of algorithms, this software helps in the segregation of plagiarized content from original content. AI text detectors have proved their worth and importance for publishers and content marketing professionals. Using this software, they can easily prove or disprove the genuinity of an individual’s work.
            </Card.Text>
            <Card.Title className="text-center">
              How Does the AI ZeroGPT Work?
            </Card.Title>
            <Card.Text>
              Our AI content detector, ZeroGPT.cc, uses massive amounts of data from different sources to precisely predict the origin of a text or a phrase. It has been tested and trained to use combinations of machine learning algorithms alongside natural language processing techniques to present the most accurate results. These algorithms are designed and developed by the expert and professional team of ZeroGPT. The accuracy of these algorithms is backed by several in-house experiments and published highly reputable papers.
            </Card.Text>
            <Card.Text>
              Our AI text detector works effectively for all versions of GPT models, including GPT-4. You can easily detect whether your text is human-written or AI/GPT Generated. Our AI text detector accurately displays the percentage of AI/GPT plagiarized text for an in-depth analysis of your content.
            </Card.Text>
          </Card.Body>
        </Card>
      </div>
      <div style={{ margin: "0 auto", width: "60%" }}>
        <h2 style={{ textAlign: "center" }}>
          Why Should You Choose Our AI Text Detector - ZeroGPT.cc?
        </h2>
        <p>
          The primary reason for trusting and choosing ZeroGPT as a reliable AI text detector is the fact that its functioning stems from authentic and well-grounded research. Other factors include:
        </p>
      </div>
<div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
  <div style={{ width: "60rem", display: "flex", justifyContent: "space-between" }}>
    <Card className="shadow-lg" style={{ width: "20rem", margin: "0 0.5rem" }}>
      <Card.Body className="blur">
        <Card.Title className="text-center">Accurate Results</Card.Title>
        <Card.Text className="text-center">
          We developed the algorithm of ZeroGPT after analyzing more than 20M articles and text generated both by AI and humans. The results presented a 98% and higher accuracy rate.
        </Card.Text>
      </Card.Body>
    </Card>
    <Card className="shadow-lg" style={{ width: "20rem", margin: "0 0.5rem" }}>
      <Card.Body className="blur">
        <Card.Title className="text-center">Fast Results</Card.Title>
        <Card.Text className="text-center">
          Another factor that makes ZeroGPT the best in the game is the fast and instantaneous results it provides.
        </Card.Text>
      </Card.Body>
    </Card>
    <Card className="shadow-lg" style={{ width: "20rem", margin: "0 0.5rem" }}>
      <Card.Body className="blur">
        <Card.Title className="text-center">Easy to Operate</Card.Title>
        <Card.Text className="text-center">
          Moreover, this AI detection tool is easy to operate, as all you have to do is paste the text and click check to get instant feedback.
        </Card.Text>
      </Card.Body>
    </Card>
  </div>
</div>
<div style={{ margin: "0 auto", width: "60%" }}>
        <h2 style={{ textAlign: "center" }}>
          What Type of Content Should ZeroGPT be Used on?
        </h2>
</div>
      <div style={{ margin: "0 auto", width: "60%" }}>
        <Card className="shadow-lg">
          <Card.Body className="blur">
            <Card.Title className="text-center">
              SEO Content
            </Card.Title>
            <Card.Text>
One of the key benefits of using ZeroGPT is that it helps in improving the website's SEO. SEO contents are very important for the success of any business. However, AI writing is continuously changing the way we write. Thus, the need for high-quality and original content is on the rise. ZeroGPT helps in making the distinction between AI-generated content and original content. With the help of this information, you will be able to make needed corrections or additions to the plagiarized text to ensure that they are genuine and authentic.           
</Card.Text>
            <Card.Title className="text-center">
              Academic Content
            </Card.Title>
            <Card.Text>
AI generators have heavily impacted the learning and education of most school and college goers. These students have found an easy way out for projects and assignments in the form of AI generators. This, no doubt, has led to a staggering decline in actual learning and real knowledge. Teachers and professors can make use of ZeroGPT to detect if their student’s assignments are original or copied. This tool also helps to expose any Chat GPT usage.
            </Card.Text>
             <Card.Title className="text-center">
              Marketing Content
            </Card.Title>
 <Card.Text>
AI generators are widely used by writers in the marketing field. The use of AI generators became prominent because of the fast results it offers. However, the authenticity of the text is lost when using these generators. Publishing this AI-generated content can bring bad publicity from the viewers. Thus, it becomes important to use ZeroGPT to detect if any AI tool has been used in the process.
            </Card.Text>
          </Card.Body>
        </Card>
      </div>
               <div style={{ margin: "0 auto", width: "60%" }}>
        <h2 style={{ textAlign: "center" }}>
          How to Easily Detect AI Content with the Help of ZeroGPT?
        </h2>
        <p>
You are just two simple steps away from detecting AI content with the help of ZeroGPT. These steps are:
        </p>
<h3 style={{ textAlign: "center" }}>
          1. Copy and Paste Content
        </h3>
 <p>
All you have to do is copy the text you want to analyze and paste it into the box on the website of ZeroGPT.
        </p>
<h3 style={{ textAlign: "center" }}>
2. Click on Detect Text
        </h3>
 <p>
After the copy and paste process, all you have to do is click on “Detect Text”. You will instantly receive the results on whether or not the text is AI-generated.
        </p>
      </div>

<div style={{ margin: "20px auto 0", width: "60%", marginBottom: "20px" }}>
  <h2 style={{ textAlign: "center" }}>Frequently Asked Questions About ZeroGPT.cc</h2>
  <Accordion>
    <Accordion.Item eventKey="0">
      <Accordion.Header style={{ background: "#f0f0f0", padding: "10px", fontWeight: "bold", border: "1px solid #ddd" }}>
        <strong>Does my data get stored by ZeroGPT?</strong>
      </Accordion.Header>
      <Accordion.Body style={{ background: "#ffffff", padding: "10px", border: "1px solid #ddd" }}>
        No, none of the data posted on the site for detection is stored after the results are received. Our tool is designed to process and analyze the content in real-time. Thus, once the results are obtained, no data is stored in our system. Thus, you can stay assured that your information stays safe and secure, as your privacy and data security are of utmost importance to us.
      </Accordion.Body>
    </Accordion.Item>
    <Accordion.Item eventKey="1">
      <Accordion.Header style={{ background: "#f0f0f0", padding: "10px", fontWeight: "bold", border: "1px solid #ddd" }}>
        <strong>Can ZeroGPT Work with Different Languages?</strong>
      </Accordion.Header>
      <Accordion.Body style={{ background: "#ffffff", padding: "10px", border: "1px solid #ddd" }}>
        Yes, ZeroGPT can work with different languages. This tool is designed to support worldwide usage. Thus, it can provide accurate text detection results for multiple languages.
      </Accordion.Body>
    </Accordion.Item>
    <Accordion.Item eventKey="2">
      <Accordion.Header style={{ background: "#f0f0f0", padding: "10px", fontWeight: "bold", border: "1px solid #ddd" }}>
        <strong>Does ZeroGPT only detect ChatGPT?</strong>
      </Accordion.Header>
      <Accordion.Body style={{ background: "#ffffff", padding: "10px", border: "1px solid #ddd" }}>
        No, ZeroGPT is a versatile tool that can detect results from other AI models as well. For instance, ZeroGPT works accurately and precisely for GPT-4, GPT-3, GPT-2, LLaMA, Google Bard, Jasper AI, Copy.AI or other AI services based on these models.
      </Accordion.Body>
    </Accordion.Item>
 <Accordion.Item eventKey="3">
      <Accordion.Header style={{ background: "#f0f0f0", padding: "10px", fontWeight: "bold", border: "1px solid #ddd" }}>
        <strong>Millions of users trust ZeroGPT's detector</strong>
      </Accordion.Header>
      <Accordion.Body style={{ background: "#ffffff", padding: "10px", border: "1px solid #ddd" }}>
        Professional writers, students, educators, freelancers, copywriters ... alike trust ZeroGPT to detect text's source whether it derives from AI tools (like ChatGPT, Google Bard, ...) or human brain.
      </Accordion.Body>
    </Accordion.Item>  
 <Accordion.Item eventKey="4">
      <Accordion.Header style={{ background: "#f0f0f0", padding: "10px", fontWeight: "bold", border: "1px solid #ddd" }}>
        <strong>How Does ZeroGPT work?</strong>
      </Accordion.Header>
      <Accordion.Body style={{ background: "#ffffff", padding: "10px", border: "1px solid #ddd" }}>
        Once you enter the text in the box and then click on the “Detect Text” button to get started. We will start analyzing your text with a series of complex and deep algorithms. These algorithms are developed by ZeroGPT's team and they are backed by our in-house experiments and some highly reputable papers already published.
Then we will show you the result as follow:
- Your text is Human written
- Your text is AI/GPT Generated
- Most of Your text is AI/GPT Generated
- Your text is Most Likely AI/GPT generated
- Your text is Likely generated by AI/GPT
- Your text contains mixed signals, with some parts generated by AI/GPT
- Your text is Likely Human written, may include parts generated by AI/GPT
- Your text is Most Likely Human written, may includes parts generated by AI/GPT
- Your text is Most Likely Human written
And a gauge with the percentage of the AI/GPT plagiarized text will be displayed for a more detailed result.
      </Accordion.Body>
    </Accordion.Item>
 <Accordion.Item eventKey="5">
      <Accordion.Header style={{ background: "#f0f0f0", padding: "10px", fontWeight: "bold", border: "1px solid #ddd" }}>
        <strong>What is the accuracy rate of ZeroGPT?</strong>
      </Accordion.Header>
      <Accordion.Body style={{ background: "#ffffff", padding: "10px", border: "1px solid #ddd" }}>
        After analyzing more than 10M articles and text, some generated by AI and others written by humans, we developed ZeroGPT's algorithm with an accuracy rate of text detection higher than 98%. Our AI text detector tool uses DeepAnalyse™ Technology to identify the origin of your text.
Our experiments are still ongoing, and our aim is to analyze more than 1B articles and text, and to converge to an error rate lower than 1%.
      </Accordion.Body>
    </Accordion.Item>
 <Accordion.Item eventKey="6">
      <Accordion.Header style={{ background: "#f0f0f0", padding: "10px", fontWeight: "bold", border: "1px solid #ddd" }}>
        <strong>Who Benefits from ZeroGPT's AI content detector?</strong>
      </Accordion.Header>
      <Accordion.Body style={{ background: "#ffffff", padding: "10px", border: "1px solid #ddd" }}>
        Students, teachers, educators, writers, employees, freelancers, copywriters and everyone on earth may find ZeroGPT a very useful solution to detect AI output text.
      </Accordion.Body>
    </Accordion.Item>
 <Accordion.Item eventKey="7">
      <Accordion.Header style={{ background: "#f0f0f0", padding: "10px", fontWeight: "bold", border: "1px solid #ddd" }}>
        <strong>Will my text get plagiarized or be available online, if I check it on ZeroGPT?</strong>
      </Accordion.Header>
      <Accordion.Body style={{ background: "#ffffff", padding: "10px", border: "1px solid #ddd" }}>
        The Privacy of our users is our top concern. When you input and check your tet on ZeroGPT, your text will not be saved or available online. And we will not use your text to train our AI detection model.
      </Accordion.Body>
    </Accordion.Item>
 <Accordion.Item eventKey="8">
      <Accordion.Header style={{ background: "#f0f0f0", padding: "10px", fontWeight: "bold", border: "1px solid #ddd" }}>
        <strong>How can I integrate ZeroGPT tool in my organization or website on a large scale?</strong>
      </Accordion.Header>
      <Accordion.Body style={{ background: "#ffffff", padding: "10px", border: "1px solid #ddd" }}>
        You are a company, a university or educational institution, an organization, a writing or content creation agency, ... Contact us via email using this link to discuss in detail about your needs and how we can integrate ZeroGPT into your organization. We provide access to our private API through our Paid Professional plans customized based on our clients' needs.
      </Accordion.Body>
    </Accordion.Item>
 <Accordion.Item eventKey="9">
      <Accordion.Header style={{ background: "#f0f0f0", padding: "10px", fontWeight: "bold", border: "1px solid #ddd" }}>
        <strong>Does ZeroGPT work with different languages?</strong>
      </Accordion.Header>
      <Accordion.Body style={{ background: "#ffffff", padding: "10px", border: "1px solid #ddd" }}>
        ZeroGPT has a worldwide usage with multilingual users. It detects AI text output in all the available languages.
      </Accordion.Body>
    </Accordion.Item>
 <Accordion.Item eventKey="10">
      <Accordion.Header style={{ background: "#f0f0f0", padding: "10px", fontWeight: "bold", border: "1px solid #ddd" }}>
        <strong>How can I cite the detector?</strong>
      </Accordion.Header>
      <Accordion.Body style={{ background: "#ffffff", padding: "10px", border: "1px solid #ddd" }}>
        Citation
You can cite the AI Text Detector in BibTex format:
      </Accordion.Body>
    </Accordion.Item>
</Accordion>
</div>

  );
}

export default Home;
