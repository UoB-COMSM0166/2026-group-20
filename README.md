<h1 align="center">The Ultimate Chicken Horse</h1>

<h3 align="center">
  COMSM0166 (2026) · Group 20 
</h3>

<p align="center">
An exciting multiplayer platformer where players design obstacles and race to reach the goal.
</p>

<h3 align="center"> Click <a href="https://uob-comsm0166.github.io/2026-group-20/main-game/"> HERE</a> to play the game (v0.1.0)</h3>

<hr style="border: none; height: 0.5px; background-color:#ddd;">

<h3>VIDEO DEMO</h3>
Add a video demo for v0.1.0 here...


<h3>PAPER DEMO</h3>

https://github.com/user-attachments/assets/4d740826-4f04-4a33-90aa-97b0868dfc5b

<h3>Group Members</h3>

GROUP PHOTO. Add a group photo here.

| Name       | Email                              |
| ---------- | ---------------------------------- |
| Megi       | jd25841@bristol.ac.uk              |
| Maran      | ilamaran.magesh.2025@bristol.ac.uk |
| Jacqueline | oz25232@bristol.ac.uk              |
| Jinwang    | ut25234@bristol.ac.uk              |
| Mengxiao   | dh25275@bristol.ac.uk              |
| Eira       | xz25553@bristol.ac.uk              |


<h3>Project Management</h3>
<p> Our project management is organised in <a href="link"> Lucidspark</a>:</p>

- Brainstorming board - used for idea generation, planning and taking meeting notes
- Kanban board - used for tracking tasks and development progress



<h2 align="center">Project Report</h2>

### 1. Introduction

- 5% ~250 words
- Describe your game, what is based on, what makes it novel? (what's the "twist"?)



### 2. Requirements

-> outlines the requirements engineering process (15% ~750 words)

Our team began by brainstorming various game ideas and collectively selected the concept to develop. After the game was selected, we identified the stakeholders to understand who would be affected by the system and whose needs should be considered during the design process. Based on this understanding, we outlined epics for the game's key features, followed by user stories describing the detailed functional requirements. The overall game flow was then designed to show how players interact with the system.

#### 2.1 Ideation and Game Selection

-> how the idea started

Each member of the team brainstormed 5-9 games of their faviourite games and brought their ideas to the meeting. During the meeting, everyone presented the core game mechanics of their proposed games.

![Ideathon](docs/assets/gif/ideation.gif)

As numerous ideas were proposed, our team decided to first identify the two key challenges: **concurrency** and **AI**. Based on these challenges, each member selected a game that either aligned with or could be adapted to fit the challenges. This process narrowed the selection down to six games.

The team then evaluated which of these games would best support the implementation of chosen challenges. As a result, two games were reduced to two games: **The Ultimate Chicken Horse** and **Among US**.

Both games were analysed to identify the most suitable base for the project. To account for time constraints, our selection involved a trade-off: a feature-rich base game would require fewer technical challenges, whereas a simpler base game would demand more complex implementations to maintain the project's level of difficulty.

|                 | <div align="center">Ultimate Chicken Horse<div>                                                                                                                                      | <div align="center">Among Us<div>                                                               |
| :-------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
|  **Features**   | • Obstacle placement <br> • Characters with different traits <br> • Different obstacles <br> • Scoreboard <br> • Coin collection / wallet system <br> • Timer <br> • Custom graphics | • Task-based mini-games <br> • Visually Distinct characters <br> • Timer <br> • Custom graphics |
| **Concurrency** | • Concurrent player movement <br> • Obstacle placement                                                                                                                               | • Concurrent player movement <br> • Task execution                                              |
| **AI Concept**  | AI solver that can be purchased with coins recommends obstacle placement                                                                                                             | AI imposter that decides whom, where and how to attack                                          |

Based on this comparison, **The Ultimate Chicken Horse** was selected as the base game due to its feature-rich design. This ensures that even if time constraints limit the implementation of the planned technical challenges, the project will still remain functional and cohesive as a playable game.

-> Add Appendix A: selection process

#### 2.2 Stakeholders

-> who is involved

To begin our game design process, we identified all relevant stakeholders including individuals and entities that needed to be taken into account when developing our game. These stakeholders were visualised using an onion model diagram.

![onion model](docs/assets/images/onion-model.png)

Given the academic context of our game, we did not need to account for legal or commercial stakeholders, enabling us to focus on the end users to whom we had direct access. We categorised the most relevant stakeholders into three groups: gamers, lecturers, and other students, to better identify the qualities each group would expect in a game.

- **Gamers**: As primary users, they interact directly with the system. They expect an engaging and enjoyable gameplay experience.

- **Lecturers**: As primary assessors, they evaluate the design process, technical implementation and whether the project meets academic requirements.

- **Other students**: As peer testers, they provide critical feedbacks on bugs and playability.

#### 2.3 Epics

-> high level requirements

Building on our stakeholder analysis, we defined a set of epics (high-level requirements). These requirements were designed to satisfy the expectations of each stakeholder group, as the goal of the project was to develop a game aligns with user expectations.


| <div align="center">Stakeholder Group<div> | <div align="center">High Level Requirements<div>                                                                                                                                                                                                                                     |
| :----------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|                 **Gamers**                 | • Retro / Nostalgic visuals <br> • Twists or added gameplay features <br> • Visually stimulating design <br> • Background audio and sound effects <br> • Game lore <br> • Core features (wallet system, scoreboard, intro tutorial) <br> • Good UX <br> • Multi-device compatibility |
|               **Lecturers**               | • Learning concept integration and application <br> • Clear demonstration of technical challenges <br> • Achievable within the project timeline <br> • Collaborative work <br> • Continuous progress updates <br> • Originality                                                      |
|                **Students**                | • Social features <br> • Easy to pick up <br> • Short game sessions                                                                                                                                                                                                                  |

#### 2.4 User Stories

-> detailed requirements
After defining the epics, we deconstructed them into a set of user stories to describe the specific features and functionalities of the game from the perspective of the identified stakeholders.

#### Students

- As a student, I want the game to have a multiplayer mode, so that I can play with my friends.
- As a student, I want the game to have intuitive controls/mechanics, so that I can start playing right away.
- As a student, I want a game run/level to be short enough so that I can play between class breaks.

#### Lecturers

- As a lecturer, I want the game to clearly demonstrate applied programming concepts (e.g., OOP, game logic, UI handling), so that learning outcomes are achieved.
- As a lecturer, I want the game to include defined challenges with measurable outcomes, so that student understanding can be evaluated.
- As a lecturer, I want clear evidence of teamwork (shared commits, divided responsibilities, group meeting notes etc.), so that collaboration skills are demonstrated.

#### Gamers

- As a gamer, I want a scoreboard, so that I can track my performance and try to beat my high score.
- As a gamer, I want a short interactive tutorial, so that I can quickly understand how to play.
- As a gamer, I want intuitive menus and clear navigation, so that I can easily access and play the game without confusion.
- As a gamer, I want responsive sound effects and visual feedback for my actions, so that the game feels immersive and satisfying.

#### 2.5 Use Case Diagram

(~100 words) -> visual overview
add a paragraph here

### 3. Design

(15% ~750 words)

- System architecture. Class diagrams, behavioural diagrams.

#### 3.3 Behaviourial Diagram

```mermaid
stateDiagram-v2

[*] --> StartMenu
StartMenu --> Lobby
Lobby --> PreGameSetup

state "Pre-Game Setup" as PreGameSetup {
    direction LR
    Character --> Map
    Map --> Obstacle
    Obstacle --> Placement
}

PreGameSetup --> GameStart
GameStart --> Gameplay
Gameplay --> ReachGoal

ReachGoal --> GameEnd : goal reached
Gameplay --> GameEnd : time limit reached

GameEnd --> [*]
```

### 4. Implementation

(15% ~750 words)

- Describe implementation of your game, in particular highlighting the TWO areas of _technical challenge_ in developing your game.



### 5. Evaluation

(15% ~750 words)

- One qualitative evaluation (of your choice)
- One quantitative evaluation (of your choice)
- Description of how code was tested.

#### 5.1

Add think aloud and heuristic evaluation for v0.1.0

will need to do the evaluation again when the game is almost ready


### 6. Process

(15% ~750 words)

- Teamwork. How did you work together, what tools and methods did you use? Did you define team roles? Reflection on how you worked together. Be honest, we want to hear about what didn't work as well as what did work, and importantly how your team adapted throughout the project.


### 7. Conclusion

(10% ~500 words)

- Reflect on the project as a whole. Lessons learnt. Reflect on challenges. Future work, describe both immediate next steps for your current game and also what you would potentially do if you had chance to develop a sequel.


### 8. Contribution Statement

- Provide a table of everyone's contribution, which _may_ be used to weight individual grades. We expect that the contribution will be split evenly across team-members in most cases. Please let us know as soon as possible if there are any issues with teamwork as soon as they are apparent and we will do our best to help your team work harmoniously together.



### 9. Appendix

You can delete this section in your own repo, it's just here for information. in addition to the marks above, we will be marking you on the following two points:

- **Quality** of report writing, presentation, use of figures and visual material (5% of report grade)
    - Please write in a clear concise manner suitable for an interested layperson. Write as if this repo was publicly available.
- **Documentation** of code (5% of report grade)
    - Organise your code so that it could easily be picked up by another team in the future and developed further.
    - Is your repo clearly organised? Is code well commented throughout?
