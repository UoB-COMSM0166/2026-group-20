import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export class AIMapGenerator {
  constructor(apiKey) {
    // this.ai = new GoogleGenAI({
    //     apiKey: apiKey || import.meta.env.VITE_GEMINI_API_KEY
    // });

    this.apiKey = apiKey;
    this.systemPrompt = `
        You are a 2D platformer game map designer. Your role is to generate a random complex map for a 2D platformer game along with the original "Start_Point" and "End_Point"
        
        Inputs:
        1. "Label" - A key-value pair of labels. This will tell you what integer is what type of block in the map. (e.g. 0 : "Empty Space", 31 : "Solid Block", 1:"Start_Point", 2:"End_Point")
        
        Output:
        Follow the schema given for output
        1. Map - A 2D flattened map from the given input labels. The output Map array length should be equal to 600 indices.
        
        <rules>
        
        - A character can walk on top of the "Solid Block" 
        - A block is an index in the map array
        - A character is one block in height and width.
        - A character can jump and move horizontally and vertically at max 4 blocks 
        - You use "Solid Block" to generate random structure in Map.
        - Place a 3-block horizontal platform immediately beneath the "Start_Point"
        - First index in the array is top left block and last index in the array is bottom right block in the map.
        - The map has 30 columns and 17 rows. You have in total 510 indices.
        - "Start_Point" is where a character spawns
        - "End_Point" is where a character needs to reach to finish
        - Do not change "Start_Point" and "End_Point".
        - Keep the "Start_Point" and "End_Point" labels in the output
        - Last row need not be entirely "Solid Block"
        - Do not add any other integers than in Labels in the Map
        - The path needs to be sub-optimal, not always a direct path
        - Platforms can be of varying rows and columns e.g: 2x5, 1x3, 6x2, 4x3
        
        </rules>
        
        Follow the rules. Once created the map, check again if you have followed all the rules. Place a 3 "Solid Block" horizontal platform immediately beneath the "Start_Point".
        Do not wrap the json responses in JSON markers.
        `;
    this.responseSchema = z.object({
        map: z.array(z.number()).describe(`
            Flattened 2D array of integers that represent the map generated.
            The size is 30x17 (width x height)
        `),
      });
  }

  async generateMap(apiKey) {
      const keyToUse = apiKey || this.apiKey;
      try {
          let data =  await this._callToGenerateMap(keyToUse);
          
          if (data.length < 510) {
              data = data.concat(new Array(510 - data.length).fill(0));
          } else {
              data = data.slice(0, 510);
          }
          
          data = this.scaleMap(data);
          // console.log(data);

          let startPoint = -1;
          let endPoint = -1;
          
          data = data.map((value, index) => {
              if (value === 1) {
                  startPoint = index;
                  return 0;
              }
              if (value === 2) {
                  endPoint = index;
                  return 0;
              }
              return value;
          });

          data = this.processSolidBlocks(data);
          // console.log(data);
          return {
              map: data,
              startPoint: startPoint,
              endPoint: endPoint
          };
          
      }
      catch (error) {
          throw error;
      }
  }

  async _callToGenerateMap(apiKey) {
    if (!apiKey) {
        throw new Error("API Key is required for AI Map Generation");
    }
    const inputPrompt = `
        Follow the system instructions and generate a map using the below inputs.
        Input:
        Label: {0:"Empty Space", 31:"Solid Block", 1:"Start_Point", 2:"End_Point"}
    `;
    var attempt = 1;
    var waitTime = 1000; // ms
    let data;
    for (let i = 0; i < 3; i++) {
        try {
            console.log(`Starting Generation`);
            // const response = await this.ai.models.generateContent({
            //     model: "gemini-2.5-flash",
            //     contents: inputPrompt,
            //     systemInstructions: this.systemPrompt,
            //     config: {
            //         responseMimeType: "application/json",
            //         responseJsonSchema: z.toJSONSchema(this.responseSchema),
            //     },
            // });
            console.log(apiKey);
            const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "google/gemini-3-1-pro-preview",
                    messages: [
                        {
                            role: "system",
                            content: this.systemPrompt
                        },
                        {
                            role: "user",
                            content: inputPrompt
                        }
                    ]
                })
            });

            data = await response.json();
            await console.log("Generated AI Map");
            // await console.log(data.choices[0].message.content, typeof data.choices[0].message.content);

            // await new Promise((resolve) => setTimeout(resolve, 30000));
            // console.log(datab.choices[0].message.content.Map);
            //
            // let data = [
            //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 31, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 31, 31, 31, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 31, 31, 31, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 31, 0, 0, 31, 31, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 31, 0, 0, 31, 31, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 31, 31, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 31, 0, 0, 0
            // ]

            let mapData = JSON.parse(data.choices[0].message.content);
            console.log("new Map: ", mapData.Map);
            return mapData.Map;


        } catch (error) {
            if (i == 2) {
                console.log("Error generating map by AI:", error);
                console.log("Using procedural generation");
                return;
            } else {
                let delay = waitTime * 2 ** (i + 1);
                console.log(`Attempted ${i+1} times. Retrying in ${delay / 1000}s...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
  }

  scaleMap(data) {
      data = data.flatMap((x) => [x, x]);
      let newData = Array();
      let start = 0;
      for(let end = 1; end <= 17; end++) {
          newData.push(
              Array.from({length: 2}, () => data.slice(start, end * 30 * 2)).flat()
          );
          start = end * 30 * 2;
      }
      return newData.flat();
  }

  processSolidBlocks(data) {
      return data.map((value, index) => {
          if (value === 31) {
              if ((index >= 60 && data[index - 60] === 0) || index < 60) {
                  return 2;
              }
              return 12;
          }
          return value;
      });
  }


}