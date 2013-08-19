namespace BouvetOneRegistation.Models
{
    public class Session
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
    }

    public enum Level
    {
        Beginner,
        Intermediate,
        Advanced
    }
}
