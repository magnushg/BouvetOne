using System.Collections.Generic;
namespace BouvetOneRegistation.Models
{
    public class Speaker
    {
        private string _name;

        public Speaker()
        {
            Sessions = new List<Session>();
        }

        public string Name { 
            get
            {
                return _name.ToLower();
            } 
            set
            {
                _name = value.ToLower();
            } 
        }

        public int Id { get; set; }
        public ICollection<Session> Sessions { get; set; }
    }
}
